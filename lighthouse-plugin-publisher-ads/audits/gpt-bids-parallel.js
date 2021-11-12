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

const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records.js');
const {assert} = require('../utils/asserts');
const {auditNotApplicable} = require('../messages/common-strings');
const {Audit} = require('lighthouse');
const {getCriticalGraph} = require('../utils/graph');
const {getTimingsByRecord} = require('../utils/network-timing');
const {isGptImplTag, isBidRequest, getHeaderBidder} = require('../utils/resource-classification');

/** @typedef {LH.Artifacts.NetworkRequest} NetworkRequest */
/** @typedef {LH.Gatherer.Simulation.NodeTiming} NodeTiming */

const id = 'gpt-bids-parallel';
const UIStrings = {
  title: 'GPT and bids loaded in parallel',
  failureTitle: 'Load GPT and bids in parallel',
  description: 'To optimize ad loading, bid requests should not wait on GPT ' +
  'to load. This issue can often be fixed by making sure that bid requests ' +
  'do not wait on `googletag.pubadsReady` or `googletag.cmd.push`. ' +
  '[Learn More](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/gpt-bids-parallel' +
  ').',
  columnBidder: 'Bidder',
  columnUrl: 'URL',
  columnStartTime: 'Start',
  columnDuration: 'Duration',
};

/**
 * Table headings for audits details sections.
 * @type {LH.Audit.Details.Table['headings']}
 */
const HEADINGS = [
  {key: 'bidder', itemType: 'text', text: UIStrings.columnBidder},
  {key: 'url', itemType: 'url', text: UIStrings.columnUrl},
  {key: 'startTime', itemType: 'ms', text: UIStrings.columnStartTime},
  {key: 'duration', itemType: 'ms', text: UIStrings.columnDuration},
];

/**
 * Audit to check if serial header bidding occurs
 */
class GptBidsInParallel extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id,
      title: UIStrings.title,
      failureTitle: UIStrings.failureTitle,
      description: UIStrings.description,
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
    const network = await NetworkRecords.request(devtoolsLog, context);

    const pubadsImpl = network.find((r) => isGptImplTag(r.url));
    if (!pubadsImpl) {
      return auditNotApplicable.NoGpt;
    }

    const bids = network.filter(isBidRequest)
        .filter((b) => b.frameId == pubadsImpl.frameId);
    if (!bids.length) {
      return auditNotApplicable.NoBids;
    }

    /** @type {Map<NetworkRequest, NodeTiming>} */
    const timingsByRecord = await getTimingsByRecord(
      trace, devtoolsLog, context);
    const tableView = [];
    /** @type {Set<string>} */ const seen = new Set();
    for (const bid of bids) {
      if (getCriticalGraph(network, trace.traceEvents, bid).has(pubadsImpl)) {
        const {startTime, endTime} = timingsByRecord.get(bid) || bid;
        const bidder = assert(getHeaderBidder(bid.url));
        if (seen.has(bidder)) {
          // Don't include multiple requests from the same bidder in the results
          // table.
          continue;
        }
        seen.add(bidder);
        tableView.push({
          bidder,
          url: bid.url,
          startTime,
          duration: endTime - startTime,
        });
      }
    }
    const failed = tableView.length > 0;
    return {
      numericValue: tableView.length,
      numericUnit: 'unitless',
      score: failed ? 0 : 1,
      details: failed ?
        GptBidsInParallel.makeTableDetails(HEADINGS, tableView) : undefined,
    };
  }
}

module.exports = GptBidsInParallel;
module.exports.UIStrings = UIStrings;
