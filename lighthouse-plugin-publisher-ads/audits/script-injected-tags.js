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

const i18n = require('lighthouse/lighthouse-core/lib/i18n/i18n');
const PageDependencyGraph = require('lighthouse/lighthouse-core/computed/page-dependency-graph');
const {auditNotApplicable} = require('../messages/common-strings');
const {Audit} = require('lighthouse');
const {getTimingsByRecord} = require('../utils/network-timing');
const {getTransitiveClosure} = require('../utils/graph');
const {isGptAdRequest} = require('../utils/resource-classification');

/** @typedef {LH.Artifacts.NetworkRequest} NetworkRequest */
/** @typedef {LH.Gatherer.Simulation.NodeTiming} NodeTiming */

const UIStrings = {
  title: 'No script-injected tags found',
  failureTitle: 'Avoid script-injected tags',
  description: 'Load scripts directly with `<script async src=...>` instead ' +
  'of injecting scripts with JavaScript. This allows the browser fetch the ' +
  'script sooner. [Learn more](' +
  'https://www.igvita.com/2014/05/20/script-injected-async-scripts-considered-harmful/' +
  ').',
  displayValue: '{numTags, plural, =1 {1 script-injected resource} ' +
  'other {# script-injected resources}}',
  columnRequest: 'Resource',
  columnStartTime: 'Start',
  columnDuration: 'Duration',
  columnLineNumber: 'Source Line Number',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

/**
 * Table headings for audits details sections.
 * @type {LH.Audit.Details.Table['headings']}
 */
const HEADINGS = [
  {
    key: 'request',
    itemType: 'url',
    text: str_(UIStrings.columnRequest),
  },
  {
    key: 'startTime',
    itemType: 'ms',
    text: str_(UIStrings.columnStartTime),
    granularity: 1,
  },
  {
    key: 'duration',
    itemType: 'ms',
    text: str_(UIStrings.columnDuration),
    granularity: 1,
  },
  {
    key: 'lineNumber',
    itemType: 'numeric',
    text: str_(UIStrings.columnLineNumber),
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
      id: 'script-injected-tags',
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
    const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const trace = artifacts.traces[Audit.DEFAULT_PASS];
    // @ts-ignore
    const mainDocumentNode = await PageDependencyGraph.request(
      {trace, devtoolsLog}, context);

    const closure = getTransitiveClosure(mainDocumentNode, isGptAdRequest);
    if (!closure.requests.length) {
      return auditNotApplicable.NoAdRelatedReq;
    }
    const injectedBlockingRequests = closure.requests
        .filter((r) =>
          r.resourceType == 'Script' && r.initiator.type == 'script')
        .filter((r) =>
          r.initiatorRequest && r.initiatorRequest.url == r.documentURL);

    /** @type {Map<NetworkRequest, NodeTiming>} */
    const timings = await getTimingsByRecord(
      trace, devtoolsLog, context);
    const tableView = injectedBlockingRequests.map((req) =>
      Object.assign({}, timings.get(req), {
        request: req.url,
        lineNumber: req.initiator.stack.callFrames[0].lineNumber,
      }));
    tableView.sort((a, b) => a.startTime - b.startTime);

    const failed = tableView.length > 0;
    return {
      numericValue: tableView.length,
      score: failed ? 0 : 1,
      displayValue: str_(UIStrings.displayValue, {numTags: tableView.length}),
      details: ScriptInjectedTags.makeTableDetails(HEADINGS, tableView),
    };
  }
}

module.exports = ScriptInjectedTags;
module.exports.UIStrings = UIStrings;
