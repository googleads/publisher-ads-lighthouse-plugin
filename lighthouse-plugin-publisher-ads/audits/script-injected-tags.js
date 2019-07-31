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

const array = require('../utils/array.js');
const i18n = require('lighthouse/lighthouse-core/lib/i18n/i18n');
const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records');
const PageDependencyGraph = require('lighthouse/lighthouse-core/computed/page-dependency-graph');
const {auditNotApplicable} = require('../messages/common-strings');
const {Audit} = require('lighthouse');
const {computeAdRequestWaterfall} = require('../utils/graph');
const {getScriptEvaluationTimes} = require('../utils/network-timing');

/** @typedef {LH.Artifacts.NetworkRequest} NetworkRequest */
/** @typedef {LH.Gatherer.Simulation.NodeTiming} NodeTiming */

// Don't bother failing on scripts that are dynamically inserted but load
// quickly.
const MINIMUM_LOAD_TIME_MS = 400;

const UIStrings = {
  title: 'Ad scripts are loaded statically',
  failureTitle: 'Load ad scripts statically',
  description: 'Load the following scripts directly with ' +
  '`<script async src=...>` instead of injecting scripts with JavaScript. ' +
  'Doing so allows the browser to preload scripts sooner. [Learn more](' +
  'https://www.igvita.com/2014/05/20/script-injected-async-scripts-considered-harmful/' +
  ').',
  failureDisplayValue: 'Load {tags, plural, =1 {1 script} other {# scripts}} statically',
  columnUrl: 'Script',
  columnLoadTime: 'Load Time',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

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
    key: 'loadTime',
    itemType: 'ms',
    granularity: 1,
    text: str_(UIStrings.columnLoadTime),
  },
];

const STATICALLY_LOADABLE_TAGS = [
  /amazon-adsystem.com\/aax2\/apstag.js/,
  /js-sec.indexww.com\/ht\/p\/.*.js/,
  /pubads.g.doubleclick.net\/tag\/js\/gpt.js/,
  /static.criteo.net\/js\/.*\/publishertag.js/,
  /www.googletagservices.com\/tag\/js\/gpt.js/,
];

/** @inheritDoc */
class StaticAdTags extends Audit {
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
    const networkRecords = await NetworkRecords.request(devtoolsLog, context);
    const tagReqs = networkRecords.filter(
      (req) => STATICALLY_LOADABLE_TAGS.find((t) => req.url.match(t)));

    const criticalRequests =
      await computeAdRequestWaterfall(trace, devtoolsLog, context);
    // Find critical scripts that were loaded by inline scripts, which could
    // have been loaded statically.
    for (const {record} of criticalRequests) {
      if (record.resourceType !== 'Script') {
        // Don't count resources that aren't scripts.
        continue;
      }
      if (record.initiator.type !== 'script') {
        // Don't count resources that weren't loaded by inline scripts.
        continue;
      }
      const initiators = PageDependencyGraph.getNetworkInitiators(record);
      if (initiators.length !== 1 || initiators[0] !== record.documentURL) {
        // We can't recommend static loading of requests that depend on other
        // scripts.
        continue;
      }
      tagReqs.push(record);
    }

    if (!tagReqs.length) {
      return auditNotApplicable.NoTag;
    }

    const seenUrls = new Set();
    const tableView = [];

    const scriptTimes =
      await getScriptEvaluationTimes(trace, devtoolsLog, context);
    for (const tag of tagReqs) {
      if (seenUrls.has(tag.url)) continue;
      seenUrls.add(tag.url);
      const relatedTags = tagReqs.filter((t) => t.url === tag.url);

      const numStatic = array.count(
        relatedTags, (t) => t.initiator.type === 'parser' && !t.isLinkPreload);
      if (numStatic === 0) {
        const loadTime = scriptTimes.get(tag.url) || 0;
        if (loadTime < MINIMUM_LOAD_TIME_MS) {
          continue;
        }
        tableView.push({
          url: tag.url,
          loadTime,
        });
      }
    }
    tableView.sort((a, b) => a.loadTime - b.loadTime);

    const failed = tableView.length > 0;
    return {
      displayValue: failed ?
        str_(UIStrings.failureDisplayValue, {tags: tableView.length}) : '',
      score: Number(!failed),
      numericValue: tableView.length,
      details: StaticAdTags.makeTableDetails(HEADINGS, tableView),
    };
  }
}

module.exports = StaticAdTags;
module.exports.UIStrings = UIStrings;
