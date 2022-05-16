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

const i18n = require('lighthouse/lighthouse-core/lib/i18n/i18n.js');
const {auditNotApplicable} = require('../messages/common-strings');
const {Audit} = require('lighthouse');
const {computeAdRequestWaterfall} = require('../utils/graph');

/** @typedef {LH.Gatherer.Simulation.NodeTiming} NodeTiming */
/** @typedef {import('../utils/graph').SimpleRequest} SimpleRequest */

const UIStrings = {
  title: 'Ad request waterfall',
  failureTitle: 'Reduce critical path for ad loading',
  description: 'Consider reducing the number of resources, loading multiple ' +
  'resources simultaneously, or loading resources earlier to improve ad ' +
  'speed. Requests that block ad loading can be found below. [Learn more](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/ad-request-critical-path' +
  ').',
  displayValue: '{serialResources, plural, =1 {1 serial resource} other {# serial resources}}',
  columnUrl: 'Request',
  columnType: 'Type',
  columnStartTime: 'Start',
  columnEndTime: 'End',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

/**
 * Table headings for audits details sections.
 * @type {LH.Audit.Details.Table['headings']}
 */
const HEADINGS = [
  {
    key: 'nameOrTld',
    itemType: 'text',
    text: str_(UIStrings.columnType),
  },
  {
    key: 'url',
    itemType: 'url',
    text: str_(UIStrings.columnUrl),
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
 * Computes the depth of the loading graph by comparing timings.
 * @param {SimpleRequest[]} requests
 * @return {number}
 */
function computeDepth(requests) {
  let prevEnd = 0;
  let hops = 0;
  for (const {startTime, endTime} of requests) {
    if (startTime >= prevEnd) {
      ++hops;
      prevEnd = endTime;
    } else {
      prevEnd = Math.min(prevEnd, endTime);
    }
  }
  return hops;
}

const MINIMUM_NOTEWORTHY_IDLE_GAP_MS = 150;

/**
 * Computes idle times in the network loading graph
 * @param {SimpleRequest[]} blockingRequests A list of request that appear in
 *     the ad loading graph.
 * @return {number[]} List of idle durations.
 */
function computeIdleTimes(blockingRequests) {
  let maxEndSoFar = Infinity;
  const idleTimes = [];
  for (let i = 0; i < blockingRequests.length;) {
    const {startTime, endTime} = blockingRequests[i];
    if (startTime - maxEndSoFar > MINIMUM_NOTEWORTHY_IDLE_GAP_MS) {
      idleTimes.push(startTime - maxEndSoFar);
    }

    maxEndSoFar = endTime;
    while (++i < blockingRequests.length &&
        blockingRequests[i].startTime < maxEndSoFar) {
      maxEndSoFar = Math.max(maxEndSoFar, blockingRequests[i].endTime);
    }
  }
  return idleTimes;
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
      scoreDisplayMode: 'informative',
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

    const tableView =
      (await computeAdRequestWaterfall(trace, devtoolsLog, context))
          .filter((r) => r.startTime > 0 && r.startTime < r.endTime);
    if (!tableView.length) {
      return auditNotApplicable.NoAds;
    }
    const depth = computeDepth(tableView);
    const failed = depth > 3;

    for (const row of tableView) {
      delete row.record; // Remove circular references before serialization.
    }

    const idleTimes = computeIdleTimes(tableView);
    const maxIdleTime = Math.max(...idleTimes);
    const totalIdleTime = idleTimes.reduce((total, time) => total + time, 0);

    return {
      numericValue: depth,
      numericUnit: 'unitless',
      score: failed ? 0 : 1,
      displayValue: str_(UIStrings.displayValue, {serialResources: depth}),
      details: {
        size: tableView.length,
        depth,
        maxIdleTime,
        totalIdleTime,
        ...AdRequestCriticalPath.makeTableDetails(HEADINGS, tableView),
      },
    };
  }
}

module.exports = AdRequestCriticalPath;
module.exports.UIStrings = UIStrings;
