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
const util = require('util');
const {auditNotApplicable} = require('../utils/builder');
const {AUDITS, NOT_APPLICABLE} = require('../messages/messages.js');
const {Audit} = require('lighthouse');
const {getCriticalPath} = require('../utils/graph');
const {getPageStartTime} = require('../utils/network-timing');
const {isGptAdRequest} = require('../utils/resource-classification');
const {URL} = require('url');

const id = 'ad-request-critical-path';
const {
  title,
  failureTitle,
  description,
  displayValue,
} = AUDITS[id];

/**
 * @typedef {Object} SimpleRequest
 * @property {string} url
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
    key: 'url',
    itemType: 'url',
    text: 'Request',
  },
  {
    key: 'startTime',
    itemType: 'ms',
    text: 'Start Time',
    granularity: 1,
  },
  {
    key: 'endTime',
    itemType: 'ms',
    text: 'End Time',
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
 * Summarizes the given array of requests by merging overlapping requests with
 * the same url. The resulting array will be ordered by start time.
 * @param {Array<SimpleRequest>} requests
 * @return {Array<SimpleRequest>}
 */
function computeSummaries(requests) {
  // Sort requests by URL first since we will merge overlapping records with
  // the same URL below, using a similar algorithm to std::unique.
  // Within a url, we sort by time to make overlap checks easier.
  requests.sort((a, b) => {
    if (a.url != b.url) {
      return a.url < b.url ? -1 : 1;
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
      if (!next || current.url != next.url ||
          next.startTime > current.endTime) {
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
    } else {
      prevEnd = Math.min(prevEnd, endTime);
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
  const u = new URL(url);
  return u.origin + u.pathname;
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
    // @ts-ignore - TODO: add AsyncCallStacks to enum.
    return {
      id,
      title,
      failureTitle,
      description,
      requiredArtifacts: ['devtoolsLogs', 'traces', 'AsyncCallStacks'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts, context) {
    const trace = artifacts.traces[Audit.DEFAULT_PASS];
    const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const networkRecords = await NetworkRecords.request(devtoolsLog, context);

    const adRequest = networkRecords.find(isGptAdRequest);
    const criticalRequests = getCriticalPath(
      networkRecords, adRequest, trace.traceEvents);

    const blockingRequests = Array.from(criticalRequests)
        .filter((r) => ['Script', 'XHR', 'Fetch', 'EventStream', 'Document'].includes(r.resourceType))
        .filter((r) => r.mimeType != 'text/css');

    if (!blockingRequests.length) {
      return auditNotApplicable(NOT_APPLICABLE.NO_ADS);
    }
    const pageStartTime = getPageStartTime(networkRecords);
    let tableView = blockingRequests.map((req) =>
      ({
        url: requestName(req.url),
        startTime: (req.startTime - pageStartTime) * 1000,
        endTime: (req.endTime - pageStartTime) * 1000,
        duration: (req.endTime - req.startTime) * 1000,
      }));
    tableView = computeSummaries(tableView);

    const depth = computeDepth(tableView);
    const failed = depth > 3;

    return {
      rawValue: depth,
      score: failed ? 0 : 1,
      displayValue: util.format(displayValue, depth, tableView.length),
      details: AdRequestCriticalPath.makeTableDetails(HEADINGS, tableView),
    };
  }
}

module.exports = AdRequestCriticalPath;
