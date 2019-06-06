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
const {getAdCriticalGraph} = require('../utils/graph');
const {getPageStartTime} = require('../utils/network-timing');
const {URL} = require('url');

const id = 'ad-request-critical-path';
const {
  title,
  failureTitle,
  description,
  displayValue,
  headings,
} = AUDITS[id];

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
    text: headings.url,
  },
  {
    key: 'type',
    itemType: 'text',
    text: headings.type,
  },
  {
    key: 'startTime',
    itemType: 'ms',
    text: headings.startTime,
    granularity: 1,
  },
  {
    key: 'endTime',
    itemType: 'ms',
    text: headings.endTime,
    granularity: 1,
  },
  {
    key: 'duration',
    itemType: 'ms',
    text: headings.duration,
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
  if (r1.type != r2.type) {
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
 * Extracts the request from a URL.
 * @param {string} url
 * @return {string}
 */
function getAbbreviatedUrl(url) {
  const u = new URL(trimUrl(url));
  const parts = u.pathname.split('/');
  if (parts.length > 4) {
    u.pathname = [...parts.splice(0, 4), '...'].join('/');
  }
  return u.toString();
}

/**
 * Removes the query string from the URL.
 * @param {string} url
 * @return {string}
 */
function trimUrl(url) {
  const u = new URL(url);
  const PATH_MAX = 60;
  const path = u.pathname.length > PATH_MAX ?
    u.pathname.substr(0, PATH_MAX) + '...' : u.pathname;
  return u.origin + path;
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
      id,
      title,
      failureTitle,
      description,
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

    const REQUEST_TYPES = ['Script', 'XHR', 'Fetch', 'EventStream', 'Document'];
    const blockingRequests = Array.from(criticalRequests)
        .filter((r) => REQUEST_TYPES.includes(r.resourceType))
        .filter((r) => r.mimeType != 'text/css');

    if (!blockingRequests.length) {
      return auditNotApplicable(NOT_APPLICABLE.NO_ADS);
    }
    const pageStartTime = getPageStartTime(networkRecords);
    let tableView = blockingRequests.map((req) => ({
      url: trimUrl(req.url),
      abbreviatedUrl: getAbbreviatedUrl(req.url),
      type: req.resourceType,
      startTime: (req.startTime - pageStartTime) * 1000,
      endTime: (req.endTime - pageStartTime) * 1000,
      duration: (req.endTime - req.startTime) * 1000,
    })).filter((r) => r.duration > 30 && r.startTime > 0);
    tableView = computeSummaries(tableView);

    const depth = computeDepth(tableView);
    const failed = depth > 3;

    const serialPluralEnding = depth != 1 ? 's' : '';
    const totalPluralEnding = tableView.length != 1 ? 's' : '';

    return {
      numericValue: depth,
      score: failed ? 0 : 1,
      displayValue: util.format(
        displayValue,
        depth,
        serialPluralEnding,
        tableView.length,
        totalPluralEnding
      ),
      details: AdRequestCriticalPath.makeTableDetails(HEADINGS, tableView),
    };
  }
}

module.exports = AdRequestCriticalPath;
