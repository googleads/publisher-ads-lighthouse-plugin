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
  title: 'No blocking requests found',
  failureTitle: 'Avoid blocking requests',
  // TODO: rephrase eliminate
  description: 'To improve ad loading, speed up or eliminate the following ' +
      'requests on your page.',
  displayValue: '{serialResources, plural, =1 {1 serial resource} other {# serial resources}}, ' +
  '{totalResources, plural, =1 {1 total resource} other {# total resources}}',
  columnUrl: 'Request',
  columnType: 'Type',
  columnSelfTime: 'Self Time',
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
 * @property {?number?} selfTime
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
    key: 'selfTime',
    itemType: 'ms',
    text: str_(UIStrings.columnSelfTime),
    granularity: 1,
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
 * Computes self time for each request
 * @param {SimpleRequest[]} requests A pre-sorted list of requests by start
 *   time.
 */
function getBlockingRequests(requests) {
  let bottlneckRequest = requests[0];
  bottlneckRequest.selfTime = bottlneckRequest.duration;

  let scanEnd = bottlneckRequest.startTime;

  const results = {};
  for (let i = 1; i < requests.length - 1; i++) {
    const current = requests[i];
    if (current.endTime < scanEnd) {
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
      // The next request is a potential bottleneck.
      current.selfTime = current.endTime - left;
      bottlneckRequest = current;
      if (bottlneckRequest.selfTime > 300) {
        results.push(bottlneckRequest)
      }
    }
  }
  return results;
}

/**
 * Audit to check the length of the critical path to load ads.
 * Also determines the critical path for visualization purposes.
 */
class CriticalBlockingRequests extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id: 'critical-blocking-requests',
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
    const criticalRequests =
      AdRequestCriticalPath.computeResult(artifacts, context);

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

module.exports = CriticalBlockingRequests;
module.exports.UIStrings = UIStrings;
