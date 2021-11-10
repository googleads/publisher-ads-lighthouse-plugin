// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const BaseNode = require('lighthouse/lighthouse-core/lib/dependency-graph/base-node.js');
// eslint-disable-next-line no-unused-vars
const CpuNode = require('lighthouse/lighthouse-core/lib/dependency-graph/cpu-node.js');
// eslint-disable-next-line no-unused-vars
const NetworkNode = require('lighthouse/lighthouse-core/lib/dependency-graph/network-node.js');
const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records.js');
const {assert} = require('./asserts');
const {getNameOrTld, trimUrl} = require('../utils/resource-classification');
const {getNetworkInitiators} = require('lighthouse/lighthouse-core/computed/page-dependency-graph.js');
const {getTimingsByRecord} = require('../utils/network-timing');
const {isAdRequest, isAdSense, isGpt, isBidRequest, isAdRelated} = require('./resource-classification');

/** @typedef {LH.Gatherer.Simulation.NodeTiming} NodeTiming */
/** @typedef {LH.TraceEvent} TraceEvent */
/** @typedef {LH.Artifacts.NetworkRequest} NetworkRequest */

/**
 * @typedef {Object} NetworkSummary
 * @property {Map<string, NetworkRequest>} requestsByUrl
 * @property {Map<string, Set<string>>} xhrEdges
 * @property {NetworkRequest[]} allRecords
 */

/**
 * @param {BaseNode.Node} root The root node of the DAG.
 * @param {(req: NetworkRequest) => boolean} isTargetRequest
 * @return {?NetworkNode}
 */
function findTargetRequest(root, isTargetRequest) {
  /** @type {?NetworkNode} */
  let firstTarget = null;
  root.traverse((node) => {
    if (node.type === BaseNode.TYPES.CPU || !isTargetRequest(node.record)) {
      return;
    }
    if (firstTarget && firstTarget.startTime < node.startTime) {
      return;
    }
    firstTarget = node;
  });
  return firstTarget;
}

/**
 * Returns all requests and CPU tasks in the loading graph of the target
 * requests.
 * @param {BaseNode.Node} root The root node of the DAG.
 * @param {(req: NetworkRequest) => boolean} isTargetRequest
 * @return {{requests: NetworkRequest[], traceEvents: TraceEvent[]}}
 */
function getTransitiveClosure(root, isTargetRequest) {
  /** @type {Set<BaseNode.Node>} */
  const closure = new Set();
  /** @type {?NetworkNode} */
  const firstTarget = findTargetRequest(root, isTargetRequest);

  /** @type {NetworkRequest[]} */
  const requests = [];
  /** @type {TraceEvent[]} */
  const traceEvents = [];

  if (firstTarget == null) {
    return {requests, traceEvents};
  }

  /** @type {BaseNode.Node[]} */ const stack = [firstTarget];

  // Search target -> root
  while (stack.length) {
    const node = stack.pop();
    if (!node || closure.has(node)) {
      continue;
    }
    closure.add(node);
    stack.push(...node.getDependencies());
  }

  // Search root -> target
  const visited = new Set();
  stack.push(...root.getDependents());
  while (stack.length) {
    const node = stack.pop();
    if (!node || visited.has(node)) {
      continue;
    }
    visited.add(node);
    if (closure.has(node)) {
      for (const n of stack) {
        closure.add(n);
      }
    }
    stack.push(...node.getDependents());
  }


  for (const node of closure) {
    if (node.type === BaseNode.TYPES.NETWORK) {
      if (node.endTime < assert(firstTarget).startTime) {
        requests.push(node.record);
      }
    } else if (node.type === BaseNode.TYPES.CPU) {
      if (node.event.ts < assert(firstTarget).startTime * 1e6) {
        traceEvents.push(node.event, ...node.childEvents);
      }
    }
  }
  return {requests, traceEvents};
}

/**
 * Checks if the given XHR request is critical.
 * @param {NetworkRequest} xhrReq
 * @param {NetworkSummary} networkSummary
 * @param {Set<NetworkRequest>} criticalRequests Known critical requests.
 * @return {boolean}
 */
function isXhrCritical(xhrReq, networkSummary, criticalRequests) {
  const edges = networkSummary.xhrEdges.get(xhrReq.url);
  if (!edges) {
    return false;
  }
  for (const {url} of criticalRequests) {
    if (edges.has(url)) {
      return true;
    }
  }
  return false;
}

/**
 * Adds all XHRs and JSONPs initiated by the given script if they are critical.
 * @param {NetworkRequest} scriptReq
 * @param {NetworkRequest} parentReq
 * @param {NetworkSummary} networkSummary
 * @param {Set<NetworkRequest>} criticalRequests Known critical requests. This
 *     method may mutate this set to add new requests.
 */
function addInitiatedRequests(
  scriptReq, parentReq, networkSummary, criticalRequests) {
  const initiatedRequests = networkSummary.allRecords
      .filter((r) => r.resourceType != undefined)
      .filter((r) => ['Script', 'XHR'].includes(r.resourceType || '') &&
          r.endTime < parentReq.startTime)
      .filter((r) => r.initiatorRequest == scriptReq ||
        getNetworkInitiators(r).includes(scriptReq.url));

  for (const initiatedReq of initiatedRequests) {
    // TODO(warrengm): Check for JSONP and Fetch requests.
    const blocking =
      initiatedReq.resourceType == 'XHR' &&
      isXhrCritical(initiatedReq, networkSummary, criticalRequests);
    if (blocking) {
      linkGraph(networkSummary, initiatedReq, criticalRequests);
    }
  }
}

/**
 * Returns the set of requests in the critical path of the target request.
 * @param {NetworkRequest[]} networkRecords
 * @param {TraceEvent[]} traceEvents
 * @param {NetworkRequest} targetRequest
 * @return {Set<NetworkRequest>}
 */
function getCriticalGraph(networkRecords, traceEvents, targetRequest) {
  const summary = buildNetworkSummary(networkRecords, traceEvents);
  const criticalRequests = new Set();
  linkGraph(summary, targetRequest, criticalRequests);
  return criticalRequests;
}

/**
 * Returns the set of requests in the critical path of the target request.
 * @param {NetworkSummary} networkSummary
 * @param {?NetworkRequest} targetRequest
 * @param {Set<NetworkRequest>=} criticalRequests
 * @return {Set<NetworkRequest>}
 */
function linkGraph(
  networkSummary, targetRequest, criticalRequests = new Set()) {
  if (!targetRequest || criticalRequests.has(targetRequest)) {
    return criticalRequests;
  }
  criticalRequests.add(targetRequest);
  const seen = new Set();
  for (let stack = targetRequest.initiator.stack; stack; stack = stack.parent) {
    for (const {url} of stack.callFrames) {
      if (seen.has(url)) continue;
      seen.add(url);

      const request = networkSummary.requestsByUrl.get(url);
      if (!request) continue;

      linkGraph(networkSummary, request, criticalRequests);

      if (request.resourceType == 'Script') {
        const scriptUrl = stack.callFrames[0].url;
        const scriptReq = networkSummary.requestsByUrl.get(scriptUrl);
        if (scriptReq) {
          addInitiatedRequests(
            scriptReq,
            targetRequest,
            networkSummary,
            criticalRequests);
        }
      }
    }
  }
  // Check the initiator request just to be sure.
  linkGraph(
    networkSummary, targetRequest.initiatorRequest || null, criticalRequests);
  return criticalRequests;
}

/**
 * @param {NetworkRequest[]} networkRecords
 * @param {TraceEvent[]} traceEvents
 * @return {NetworkSummary}
 */
function buildNetworkSummary(networkRecords, traceEvents) {
  const requestsByUrl = new Map();
  for (const req of networkRecords) {
    requestsByUrl.set(req.url, req);
  }

  const xhrEvents = traceEvents
      .filter((t) => t.name.startsWith('XHR'))
      .filter((t) => !!(t.args.data || {}).url);
  const xhrEdges = new Map();
  for (const e of xhrEvents) {
    const data = e.args.data || {};
    const edges = xhrEdges.get(data.url) || new Set();
    for (const {url} of data.stackTrace || []) {
      edges.add(url);
    }
    xhrEdges.set(data.url, edges);
  }
  return {requestsByUrl, xhrEdges, allRecords: networkRecords};
}

/**
 * @typedef {Object} SimpleRequest
 * @property {string} url
 * @property {string} nameOrTld
 * @property {string} type
 * @property {number} startTime
 * @property {number} endTime
 * @property {number} duration
 * @property {number} selfTime
 * @property {NetworkRequest} [record]
 */

/**
 * Checks if two requests are similar enough to be merged.
 * @param {SimpleRequest} r1
 * @param {SimpleRequest} r2
 * @return {boolean}
 */
function areSimilarRequests(r1, r2) {
  if (Math.max(r1.startTime, r2.startTime) > Math.min(r1.endTime, r2.endTime)) {
    return false;
  }
  if (r1.type && r2.type && r1.type != r2.type) {
    return false;
  }
  if (r1.type == 'Script') {
    return false; // Don't merge script records.
  }
  return r1.nameOrTld == r2.nameOrTld;
}

/**
 * Summarizes the given array of requests by merging overlapping requests with
 * the same url. The resulting array will be ordered by start time.
 * @param {SimpleRequest[]} requests
 * @return {SimpleRequest[]}
 */
function computeSummaries(requests) {
  // Sort requests by URL first since we will merge overlapping records with
  // the same URL below, using a similar algorithm to std::unique.
  // Within a url, we sort by time to make overlap checks easier.
  requests.sort((a, b) => {
    if (a.nameOrTld != b.nameOrTld) {
      return a.nameOrTld < b.nameOrTld ? -1 : 1;
    }
    if (a.type != b.type) {
      return a.type < b.type ? -1 : 1;
    }
    if (a.startTime != b.startTime) {
      return a.startTime < b.startTime ? -1 : 1;
    }
    return a.endTime - b.endTime;
  });
  const result = [];
  for (let i = 0; i < requests.length; i++) {
    const current = requests[i];
    let next;
    while (i < requests.length) {
      next = requests[i + 1];
      if (!next || !areSimilarRequests(next, current)) {
        break;
      }
      current.endTime = Math.max(current.endTime, next.endTime);
      current.duration = current.endTime - current.startTime;
      i++;
    }
    result.push(current);
  }
  result.sort((a, b) => a.startTime - b.startTime);
  return result;
}

/**
 * @param {SimpleRequest[]} requests A pre-sorted list of requests by start
 *   time.
 */
function computeSelfTimes(requests) {
  if (!requests.length) {
    return [];
  }
  /** @type {SimpleRequest} */
  let bottlneckRequest = assert(requests[0]);
  bottlneckRequest.selfTime = bottlneckRequest.duration;

  let scanEnd = bottlneckRequest.startTime;

  for (const current of requests) {
    if (current.endTime < scanEnd || current == bottlneckRequest) {
      // Overlaps with previous requests, skip to avoid double counting.
      continue;
    }
    const left = Math.max(scanEnd, current.startTime);
    const right = Math.min(bottlneckRequest.endTime, current.endTime);
    if (left < right) {
      // @ts-ignore selfTime is initialized elsewhere, so it won't be undefined.
      bottlneckRequest.selfTime -= (right - left);
    }
    scanEnd = Math.max(scanEnd, right);
    if (current.endTime > bottlneckRequest.endTime) {
      current.selfTime = current.endTime - left;
      bottlneckRequest = current;
    }
  }
}

// TODO(warrengm): Memoize this function?
/**
 * Returns all requests in the loading graph of ads. This will return the empty
 * set if no ad requests are present.
 * @param {LH.Trace} trace
 * @param {LH.DevtoolsLog} devtoolsLog
 * @param {LH.Audit.Context} context
 * @return {Promise<SimpleRequest[]>}
 */
async function computeAdRequestWaterfall(trace, devtoolsLog, context) {
  const networkRecords = await NetworkRecords.request(devtoolsLog, context);

  const maybeFirstAdRequest =
    networkRecords.find(isAdRequest) ||
    // Fallback to another ad request
    networkRecords.find(isBidRequest) || networkRecords.find(isAdRelated);
  if (maybeFirstAdRequest == null) {
    return Promise.resolve([]);
  }
  const criticalRequests = new Set();
  const firstAdRequest = assert(maybeFirstAdRequest);
  const tagRequests = networkRecords.filter((r) =>
    isGpt(r.url) || isAdSense(r.url));
  const bidRequests = networkRecords.filter((r) =>
    isBidRequest(r) && r.endTime <= firstAdRequest.startTime);
  const summary = buildNetworkSummary(networkRecords, trace.traceEvents);
  for (const req of [firstAdRequest, ...bidRequests, ...tagRequests]) {
    linkGraph(summary, req, criticalRequests);
  }

  const REQUEST_TYPES = new Set([
    'Script', 'XHR', 'Fetch', 'EventStream', 'Document', undefined]);
  const waterfall = Array.from(criticalRequests)
      .filter((r) => r.endTime < firstAdRequest.startTime)
      .filter((r) => REQUEST_TYPES.has(r.resourceType))
      .filter((r) => r.mimeType != 'text/css');

  /** @type {Map<NetworkRequest, NodeTiming>} */
  const timingsByRecord =
      await getTimingsByRecord(trace, devtoolsLog, context);
  const timedWaterfall = waterfall.map((req) => {
    const {startTime, endTime} = timingsByRecord.get(req) || req;
    return {
      startTime,
      endTime,
      duration: endTime - startTime,
      selfTime: 0, // Computed below.
      url: trimUrl(req.url),
      nameOrTld: getNameOrTld(req.url),
      type: req.resourceType,
      record: req,
    };
  });
  const result = computeSummaries(timedWaterfall);
  computeSelfTimes(result);
  return result;
}

module.exports = {
  getTransitiveClosure,
  getCriticalGraph,
  computeAdRequestWaterfall,
};
