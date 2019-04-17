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
    key: 'lineNumber',
    itemType: 'numeric',
    text: 'HTML Line Number',
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
      title: 'Avoid script injected tags in the document',
      failureTitle: 'Found script injected tags in path of ad requests',
      description: 'Prefer loading scripts via `<script async>` instead of ' +
          'injecting script tags with JavaScript. Doing so lets the browser ' +
          'to request the script as quickly as possible. ' +
          '[Learn more.]' +
          '(https://www.igvita.com/2014/05/20/script-injected-async-scripts-considered-harmful/)',
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
    if (!closure.requests.length) {
      return auditNotApplicable('No ads requested');
    }
    const injectedBlockingRequests = closure.requests
        .filter((r) => r.resourceType == 'Script')
        .filter((r) => r.initiator.type == 'script')
        .filter((r) =>
          r.initiatorRequest && r.initiatorRequest.url == r.documentURL);

    const pageStartTime = getPageStartTime(networkRecords);
    const tableView = injectedBlockingRequests.map((req) =>
      ({
        request: req.url,
        startTime: (req.startTime - pageStartTime) * 1000,
        duration: (req.endTime - req.startTime) * 1000,
        lineNumber: req.initiator.stack.callFrames[0].lineNumber,
      }));
    tableView.sort((a, b) => a.startTime - b.startTime);

    const failed = tableView.length > 0;
    const plural = tableView.length == 1 ? '' : 's';
    return {
      rawValue: tableView.length,
      score: failed ? 0 : 1,
      displayValue: `${tableView.length} script-injected resource${plural}`,
      details: ScriptInjectedTags.makeTableDetails(HEADINGS, tableView),
    };
  }
}

module.exports = ScriptInjectedTags;
