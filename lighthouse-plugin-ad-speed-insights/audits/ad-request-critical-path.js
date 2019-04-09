// Copyright 2018 Google LLC
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

const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records');
const parseDomain = require('parse-domain');
const {auditNotApplicable} = require('../utils/builder');
const {Audit} = require('lighthouse');
const {getPageStartTime, getAdStartTime} = require('../utils/network-timing');
const {isGoogleAds, hasAdRequestPath, isGpt} = require('../utils/resource-classification');
const {URL} = require('url');

/**
 * Table headings for audits details sections.
 * @type {LH.Audit.Details.Table['headings']}
 */
const HEADINGS = [
  {
    key: 'domain',
    itemType: 'url',
    text: 'domain',
  },
  {
    key: 'startTime',
    itemType: 'ms',
    text: 'Request Start Time',
    granularity: 1,
  },
  {
    key: 'endTime',
    itemType: 'ms',
    text: 'Request End Time',
    granularity: 1,
  },
  {
    key: 'duration',
    itemType: 'ms',
    text: 'Duration',
    granularity: 1,
  },
];

function isJsonp(request) {
  return request.requestType == 'Script' && new URL(request.url).search;
}

/**
 * @param {Array<LH.Artifacts.NetworkRequest>} networkRequests
 * @param {Array<LH.Artifacts.Script>} scriptElements
 */
function findLoadingGraph(networkRequests, scriptElements) {
  const pageStartTime = getPageStartTime(networkRequests);
  const adStartTime = getAdStartTime(networkRequests);

  const requestStack = [];

  const adTags = scriptElements.filter(
      (script) => script.content.match(/googletag[.](cmd|display|pubads)/));
  for (const {requestId} of adTags) {
    const tagReq = networkRequests.find((r) => r.requestId === requestId);
    if (!tagReq) {
      continue;
    }
    requestStack.push(tagReq.url);
  }

  const adRequests = networkRequests.filter((r) => {
    const parsedUrl = new URL(r.url);
    return isGoogleAds(parsedUrl) && hasAdRequestPath(parsedUrl);
  });
  requestStack.push(...adRequests.map((r) => r.url));

  const result = new Set();
  const visited = new Set();
  while (requestStack.length) {
    const url = requestStack.pop();
    if (!url || visited.has(url)) {
      continue;
    }
    visited.add(url);
    const request = networkRequests.find((r) => r.url === url);
    if (!request || request.startTime <= pageStartTime ||
        request.endTime > adStartTime) {
      continue;
    }
    result.add(request);

    console.log(getCallerScripts(request));
    requestStack.push(...getCallerScripts(request));
    requestStack.push(request.initiatorRequest && request.initiatorRequest.url);

    if (request.resourceType == 'Script') {
      const initiatedRequests = networkRequests
          .filter((r) => ['Script', 'Fetch', 'XHR'].includes(r.resourceType))
          .filter((r) => (/\b((pre)?bid|ad|exchange|rtb)/).test(r.url))
          .filter((r) =>
              r.initiatorRequest && r.initiatorRequest.url === url ||
              getCallerScripts(r).find((u) => u === url));
      requestStack.push(...initiatedRequests.map((r) => r.url));
    }
  }
  return result
}

/**
 * Returns the entry's call stack. Default to empty if array not applicable
 * (i.e. initiator type is not "script").
 * @param {LH.Artifacts.NetworkRequest} entry
 * @return {Array<string>}
 */
function getCallerScripts(entry) {
  const initiatorDetails = getInitiatorDetails(entry);
  if (!initiatorDetails.stack || initiatorDetails.type !== 'script') {
    return [];
  }
  return initiatorDetails.stack.callFrames.map((f) => f.url);
}

/**
 * Returns the entry's initiator details. Defaults to empty object with type
 * field if it has empty _initiator_detail, to keep in line with the structure
 * of _initiator_detail.
 * @param {LH.Artifacts.NetworkRequest} entry
 * @return {LH.Crdp.Network.Initiator}
 */
function getInitiatorDetails(entry) {
  if (!entry.initiator) {
    return {
      type: '',
    };
  }
  return /** @type {LH.Crdp.Network.Initiator} */ (entry.initiator);
}

/** Computes summaries in place */
function computeSummaries(intervals) {
  if (!intervals.length) return;
  intervals.sort((a, b) => {
    if (a.domain != b.domain) {
      return a.domain < b.domain ? -1 : 1;
    }
    if (a.startTime != b.startTime) {
      return a.startTime < b.startTime ? -1 : 1;
    }
    return a.endTime - b.endTime;
  });
  let tail = 0;
  let last = intervals[0];
  last.count = 1;
  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    if (last.domain != current.domain || last.endTime < current.startTime) {
      intervals[tail++] = last;
      last = current;
      last.count = 1;
      continue;
    }
    last.endTime = Math.max(last.endTime, current.endTime);
    last.count++;
  }
  intervals.length = tail;
}

function computeDepth(requests) {
  let prevEnd = 0;
  let hops = 0;
  for (const {startTime, endTime} of requests) {
    if (startTime > prevEnd) {
      ++hops;
      prevEnd = endTime;
    }
  }
  return hops;
}

/**
 * Extracts the domain from a URL.
 * @param {string} url
 * @return {string}
 */
function domainOf(url) {
  const {host, pathname} = new URL(url);
  const parts = pathname.split('/');
  const path = parts.length < 5 : pathname : parts.splice(0, 3).join('/') + '/...';
  return host + path;
}

/**
 * Audit to check the length of the critical path to load ads.
 * Also determines the critical path for visualization purposes.
 */
class AdRequestCriticalPath extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id: 'ad-request-critical-path',
      title: 'No resources blocking first ad request',
      failureTitle: 'There are resources blocking the first ad request',
      description: 'These are the resources that block the first ad request. ' +
          'Consider reducing the number of resources or improving their ' +
          'execution to start loading ads as soon as possible. ' +
          '[Learn more.]' +
          '(https://ad-speed-insights.appspot.com/#blocking-resouces)',
      requiredArtifacts: ['devtoolsLogs', 'Scripts'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts, context) {
    const devtoolsLogs = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const networkRecords = await NetworkRecords.request(devtoolsLogs, context);
    const baseUrl = networkRecords.find((rec) => rec.statusCode == 200).url;
    const adsEntries = networkRecords.filter((entry) => {
      const parsedUrl = new URL(entry.url);
      return isGoogleAds(parsedUrl) && hasAdRequestPath(parsedUrl) &&
          parsedUrl.search.includes('vrg');
    });

    if (!adsEntries.length) {
      return auditNotApplicable('No ads requested');
    }


    const pageStartTime = getPageStartTime(networkRecords);
    const blockingRequests = findLoadingGraph(networkRecords, artifacts.Scripts);
    console.log(Array.from(blockingRequests).map(r => r.url));
    const tableView = Array.from(blockingRequests)
        .map((req) =>
          ({
            domain: domainOf(req.url),
            startTime: (req.startTime - pageStartTime) * 1000,
            endTime: (req.endTime - pageStartTime) * 1000,
            duration: (req.endTime - req.startTime) * 1000,
          }));
    computeSummaries(tableView);
    tableView.sort((a, b) => a.startTime - b.startTime);

    const depth = computeDepth(tableView);
    const failed = depth > 2;

    return {
      rawValue: depth,
      score: failed? 0 : 1,
      displayValue: failed ? `${depth} serial resources, ${tableView.length} total resources` : '',
      details: AdRequestCriticalPath.makeTableDetails(HEADINGS, tableView),
    };
  }
}

module.exports = AdRequestCriticalPath;
