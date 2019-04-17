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
// @ts-ignore Could not find module lighthouse
const PageDependencyGraph = require('lighthouse/lighthouse-core/computed/page-dependency-graph');
const {auditNotApplicable} = require('../utils/builder');
const {Audit} = require('lighthouse');
const {getPageStartTime} = require('../utils/network-timing');
const {getTransitiveClosure} = require('../utils/graph');
const {URL} = require('url');

/**
 *
 * @typedef {Object} SimpleRequest
 * @property {string} request
 * @property {number} startTime
 * @property {number} endTime
 * @property {number} duration
 */

/**
 * Table headings for audits details sections.
 * @type {LH.Audit.Details.Table['headings']}
 */
const HEADINGS = [
  {
    key: 'request',
    itemType: 'url',
    text: 'Request',
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

/**
 * Computes summaries in place by merging overlapping requests with the same
 * host and path.
 * @param {Array<SimpleRequest>} requests
 */
function computeSummaries(requests) {
  if (!requests.length) return;
  requests.sort((a, b) => {
    if (a.request != b.request) {
      return a.request < b.request ? -1 : 1;
    }
    if (a.startTime != b.startTime) {
      return a.startTime < b.startTime ? -1 : 1;
    }
    return a.endTime - b.endTime;
  });
  let tail = 0;
  let last = requests[0];
  for (let i = 1; i < requests.length; i++) {
    const current = requests[i];
    if (last.request != current.request || last.endTime < current.startTime) {
      requests[tail++] = last;
      last = current;
      continue;
    }
    last.endTime = Math.max(last.endTime, current.endTime);
  }
  requests.length = tail;
}

/**
 * Comptues the depth of the loading graph by comparing timings.
 * @param {Array<SimpleRequest>} requests
 */
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
 * Extracts the request from a URL.
 * @param {string} url
 * @return {string}
 */
function requestName(url) {
  const {host, pathname} = new URL(url);
  const parts = pathname.split('/');
  const path = parts.length < 4 ? pathname : parts.splice(0, 3).join('/') + '/...';
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
      requiredArtifacts: ['devtoolsLogs', 'traces'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts, context) {
    const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const trace = artifacts.traces[Audit.DEFAULT_PASS];
    const networkRecords = await NetworkRecords.request(devtoolsLog, context);
    // @ts-ignore
    const mainDocumentNode = await PageDependencyGraph.request(
      {trace, devtoolsLog}, context);

    /** @type {(req: LH.Artifacts.NetworkRequest) => boolean} */
    const isGptAdRequest = (req) => req.url.includes('/gampad/ads?') &&
        PageDependencyGraph.getNetworkInitiators(req).find(
          (/** @type {string} */ i) => i.includes('pubads_impl'));
    const closure = getTransitiveClosure(mainDocumentNode, isGptAdRequest);
    const blockingRequests = closure.requests
        .filter((r) => ['Script', 'XHR', 'Fetch', 'EventStream'].includes(r.resourceType))
        .filter((r) => r.mimeType != 'text/css');

    if (!blockingRequests) {
      return auditNotApplicable('No ads requested');
    }
    const pageStartTime = getPageStartTime(networkRecords);
    const tableView = blockingRequests.map((req) =>
      ({
        request: requestName(req.url),
        startTime: (req.startTime - pageStartTime) * 1000,
        endTime: (req.endTime - pageStartTime) * 1000,
        duration: (req.endTime - req.startTime) * 1000,
      }))
        .filter((t) => t.duration > 50);
    computeSummaries(tableView);
    tableView.sort((a, b) => a.startTime - b.startTime);

    const depth = computeDepth(tableView);
    const failed = depth > 2;

    return {
      rawValue: depth,
      score: failed ? 0 : 1,
      displayValue:
          `${depth} serial resources, ${tableView.length} total resources`,
      details: AdRequestCriticalPath.makeTableDetails(HEADINGS, tableView),
    };
  }
}

module.exports = AdRequestCriticalPath;
