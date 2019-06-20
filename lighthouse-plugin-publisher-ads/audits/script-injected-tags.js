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
const PageDependencyGraph = require('lighthouse/lighthouse-core/computed/page-dependency-graph');
const {auditNotApplicable} = require('../utils/builder');
const {AUDITS, NOT_APPLICABLE} = require('../messages/messages.js');
const {Audit} = require('lighthouse');
const {getTimingsByRecord} = require('../utils/network-timing');
const {getTransitiveClosure} = require('../utils/graph');
const {isGptAdRequest} = require('../utils/resource-classification');

/** @typedef {LH.Artifacts.NetworkRequest} NetworkRequest */
/** @typedef {LH.Gatherer.Simulation.NodeTiming} NodeTiming */

const id = 'script-injected-tags';
const {
  title,
  failureTitle,
  description,
  headings,
} = AUDITS[id];

/**
 * Table headings for audits details sections.
 * @type {LH.Audit.Details.Table['headings']}
 */
const HEADINGS = [
  {
    key: 'request',
    itemType: 'url',
    text: headings.request,
  },
  {
    key: 'startTime',
    itemType: 'ms',
    text: headings.startTime,
    granularity: 1,
  },
  {
    key: 'duration',
    itemType: 'ms',
    text: headings.duration,
    granularity: 1,
  },
  {
    key: 'lineNumber',
    itemType: 'numeric',
    text: headings.lineNumber,
    granularity: 1,
  },
];

/**
 * Audit to check the length of the critical path to load ads.
 * Also determines the critical path for visualization purposes.
 */
class ScriptInjectedTags extends Audit {
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
    const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const trace = artifacts.traces[Audit.DEFAULT_PASS];
    const networkRecords = await NetworkRecords.request(devtoolsLog, context);
    // @ts-ignore
    const mainDocumentNode = await PageDependencyGraph.request(
      {trace, devtoolsLog}, context);

    const closure = getTransitiveClosure(mainDocumentNode, isGptAdRequest);
    if (!closure.requests.length) {
      return auditNotApplicable(NOT_APPLICABLE.NO_AD_RELATED_REQ);
    }
    const injectedBlockingRequests = closure.requests
        .filter((r) =>
          r.resourceType == 'Script' && r.initiator.type == 'script')
        .filter((r) =>
          r.initiatorRequest && r.initiatorRequest.url == r.documentURL);

    /** @type {Map<NetworkRequest, NodeTiming>} */
    const timings = await getTimingsByRecord(
      trace, devtoolsLog, new Set(networkRecords), context);
    const tableView = injectedBlockingRequests.map((req) =>
      Object.assign({}, timings.get(req), {
        request: req.url,
        lineNumber: req.initiator.stack.callFrames[0].lineNumber,
      }));
    tableView.sort((a, b) => a.startTime - b.startTime);

    const failed = tableView.length > 0;
    const plural = tableView.length == 1 ? '' : 's';
    return {
      numericValue: tableView.length,
      score: failed ? 0 : 1,
      displayValue: `${tableView.length} script-injected resource${plural}`,
      details: ScriptInjectedTags.makeTableDetails(HEADINGS, tableView),
    };
  }
}

module.exports = ScriptInjectedTags;
