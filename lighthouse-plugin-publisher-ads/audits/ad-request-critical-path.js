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

const i18n = require('lighthouse/lighthouse-core/lib/i18n/i18n');
const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records');
const {auditNotApplicable} = require('../messages/common-strings');
const {Audit} = require('lighthouse');
const {getAbbreviatedUrl, trimUrl} = require('../utils/resource-classification');
const {getAdCriticalGraph} = require('../utils/graph');
const {getTimingsByRecord} = require('../utils/network-timing');

/** @typedef {LH.Artifacts.NetworkRequest} NetworkRequest */
/** @typedef {LH.Gatherer.Simulation.NodeTiming} NodeTiming */

const UIStrings = {
  title: 'Minimal requests found in ad critical path',
  failureTitle: 'Reduce critical path for ad loading',
  description: 'Consider reducing the number of resources, loading multiple ' +
  'resources simultaneously, or loading resources earlier to improve ad ' +
  'speed. Requests that block ad loading can be found below. [Learn more](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/ad-request-critical-path' +
  ').',
  displayValue: '{serialResources, plural, =1 {1 serial resource} other {# serial resources}}, ' +
  '{totalResources, plural, =1 {1 total resource} other {# total resources}}',
  columnUrl: 'Request',
  columnType: 'Type',
  columnStartTime: 'Start',
  columnEndTime: 'End',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

/**
 * @typedef {Object} SimpleRequest
 * @property {string} url
 * @property {string} abbreviatedUrl
 * @property {string} type
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
    text: str_(UIStrings.columnUrl),
  },
  {
    key: 'type',
    itemType: 'text',
    text: str_(UIStrings.columnType),
  },
  {
    key: 'startTime',
    itemType: 'ms',
    text: str_(UIStrings.columnStartTime),
    granularity: 1,
  },
  {
    key: 'endTime',
    itemType: 'ms',
    text: str_(UIStrings.columnEndTime),
    granularity: 1,
  },
];

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
  // Only check types if they're set on both requests.
  if (r1.type && r2.type && r1.type != r2.type) {
    return false;
  }
  return r1.abbreviatedUrl == r2.abbreviatedUrl;
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
    if (a.abbreviatedUrl != b.abbreviatedUrl) {
      return a.abbreviatedUrl < b.abbreviatedUrl ? -1 : 1;
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
      current.url = current.abbreviatedUrl;
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
 * @param {SimpleRequest[]} requests
 * @return {number}
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
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      requiredArtifacts: ['devtoolsLogs', 'traces'],
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
    const criticalRequests = getAdCriticalGraph(
      networkRecords, trace.traceEvents);

    /** @type {Map<NetworkRequest, NodeTiming>} */
    const timingsByRecord =
        await getTimingsByRecord(trace, devtoolsLog, context);
    const REQUEST_TYPES = new Set([
      'Script', 'XHR', 'Fetch', 'EventStream', 'Document', undefined]);
    const blockingRequests = Array.from(criticalRequests)
        .filter((r) => REQUEST_TYPES.has(r.resourceType))
        .filter((r) => r.mimeType != 'text/css');

    if (!blockingRequests.length) {
      return auditNotApplicable.NoAds;
    }
    let tableView = blockingRequests.map((req) => {
      const {startTime, endTime} = timingsByRecord.get(req) || req;
      return {
        startTime,
        endTime,
        duration: endTime - startTime,
        url: trimUrl(req.url),
        abbreviatedUrl: getAbbreviatedUrl(req.url),
        type: req.resourceType,
      };
    });
    tableView = computeSummaries(tableView)
        .filter((r) => r.duration > 30 && r.startTime > 0);

    const depth = computeDepth(tableView);
    const failed = depth > 3;

    return {
      numericValue: depth,
      score: failed ? 0 : 1,
      displayValue: str_(UIStrings.displayValue,
        {
          serialResources: depth,
          totalResources: tableView.length,
        }),
      details: AdRequestCriticalPath.makeTableDetails(HEADINGS, tableView),
    };
  }
}

module.exports = AdRequestCriticalPath;
module.exports.UIStrings = UIStrings;
