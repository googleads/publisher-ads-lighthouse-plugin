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

const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records');
const {auditNotApplicable} = require('../utils/builder');
const {AUDITS, NOT_APPLICABLE} = require('../messages/messages');
const {Audit} = require('lighthouse');
const {bucket} = require('../utils/array');
const {getCriticalGraph} = require('../utils/graph');
const {getTimingsByRecord} = require('../utils/network-timing');
const {isImplTag, isBidRequest} = require('../utils/resource-classification');
const {URL} = require('url');

/** @typedef {LH.Artifacts.NetworkRequest} NetworkRequest */
/** @typedef {LH.Gatherer.Simulation.NodeTiming} NodeTiming */

const id = 'gpt-bids-parallel';
const UIStrings = {
  title: 'GPT and bids loaded in parallel',
  failureTitle: 'Load GPT and bids in parallel',
  description: 'TODO',
};

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
    const {traceEvents} = artifacts.traces[Audit.DEFAULT_PASS];
    const network = await NetworkRecords.request(devtoolsLog, context);

    const bids = network.filter(isBidRequest);
    const blockedRequests = [];
    for (const bid of bids) {
      console.log(bid.url);
      const dependencies = getCriticalGraph(network, traceEvents, bid);
      console.log(dependencies.size)
      console.log(Array.from(dependencies).map(r => r.url.substr(0, 100) + ', ' + isImplTag(r.url)))
      if (Array.from(dependencies).find((r) => isImplTag(r.url))) {
        blockedRequests.push(bid);
      }
    }

    console.log(blockedRequests.map(r => r.url));

    return {
      numericValue: 0,
      score: 0,
    };
  }
}

module.exports = GptBidsInParallel;
