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

// @ts-ignore
// eslint-disable-next-line
const BaseNode = require('lighthouse/lighthouse-core/lib/dependency-graph/base-node');

/** @typedef {LH.TraceEvent} TraceEvent */
/** @typedef {LH.Artifacts.NetworkRequest} NetworkRequest */

/**
 * Returns all requests and CPU tasks in the loading graph of the target
 * requests.
 * @param {typeof BaseNode} root The root node of the DAG.
 * @param {(req: NetworkRequest) => boolean} isTargetRequest
 * @return {{requests: NetworkRequest[], traceEvents: TraceEvent[]}}
 */
function getTransitiveClosure(root, isTargetRequest) {
  const closure = new Set();
  /** @type {LH.Artifacts.NetworkRequest} */
  let firstTarget = null;
  root.traverse(/** @param {typeof BaseNode} node */ (node) => {
    if (!node.record || !isTargetRequest(node.record)) return;
    if (firstTarget && firstTarget.record.startTime < node.record.startTime) {
      return;
    }
    firstTarget = node;
  });

  // Search target -> root
  const stack = [firstTarget];
  while (stack.length) {
    const node = stack.pop();
    if (closure.has(node)) {
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
    if (visited.has(node)) {
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

  const requests = Array.from(closure).map((n) => n.record)
      .filter(Boolean).filter((r) => r.endTime < firstTarget.record.startTime);
  const cpu = Array.from(closure).filter((n) => n.event)
      .filter((n) => n.event.ts < firstTarget.startTime * 1000 * 1000)
      .map((n) => [n.event, ...n.childEvents]);

  const  traceEvents = [].concat.apply([], cpu);  // eslint-disable-line
  return {requests, traceEvents};
}

/**
 * Returns the set of requests in the critical path of the target request.
 * @param {NetworkRequest[]} networkRecords
 * @param {NetworkRequest} targetRequest
 * @param {Set<NetworkRequest>=} result
 * @return {Set<NetworkRequest>}
 */
function getCriticalPath(networkRecords, targetRequest, result = new Set()) {
  if (!targetRequest || result.has(targetRequest)) return result;
  result.add(targetRequest);
  for (let stack = targetRequest.initiator.stack; stack; stack = stack.parent) {
    // @ts-ignore
    const urls = new Set(stack.callFrames.map((f) => f.url));
    for (const url of urls) {
      const request = networkRecords.find((r) => r.url === url);
      if (request && !result.has(request)) {
        getCriticalPath(networkRecords, request, result);
      }
    }
    const sentXhr = [
      stack.description,
      stack.callFrames[0].functionName].includes('XMLHttpRequest.send');
    if (sentXhr) {
      const url = stack.callFrames[0].url;
      const request = networkRecords.find((r) => r.url === url);
      const xhrs = networkRecords.filter((r) =>
        r.initiatorRequest == request && r.resourceType == 'XHR')
          .filter((r) => r.endTime < targetRequest.startTime);
      for (const xhr of xhrs) {
        getCriticalPath(networkRecords, xhr, result);
      }
    }
  }
  getCriticalPath(networkRecords, targetRequest.initiatorRequest, result);
  return result;
}

module.exports = {getTransitiveClosure, getCriticalPath};
