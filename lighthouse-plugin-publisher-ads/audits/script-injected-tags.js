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

const array = require('../utils/array.js');
const i18n = require('lighthouse/lighthouse-core/lib/i18n/i18n.js');
const PageDependencyGraph = require('lighthouse/lighthouse-core/computed/page-dependency-graph.js');
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
  'https://developers.google.com/publisher-ads-audits/reference/audits/script-injected-tags' +
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
  /amazon-adsystem\.com\/aax2\/apstag.js/,
  /js-sec\.indexww\.com\/ht\/p\/.*\.js/,
  /pubads\.g\.doubleclick\.net\/tag\/js\/gpt\.js/,
  /static\.criteo\.net\/js\/.*\/publishertag\.js/,
  /www\.googletagservices\.com\/tag\/js\/gpt\.js/,
  /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/,
  /cdn\.ampproject\.org\/v0\/amp-ad-\d+\.\d+\.js/,
];

/**
 * Checks if the given record was initiated by an inline script with
 * dependencies on any other resource.
 * That is, the record was initiated by another script insert a <script> tag
 * into the DOM using doc.write or body.appendChild, for example.
 * @param {NetworkRequest} record
 * @return {boolean}
 */
function initiatedByInlineScript(record) {
  if (record.initiator.type !== 'script') {
    // Initiated by some other means, e.g. preload link or static script tag.
    return false;
  }
  const initiators = PageDependencyGraph.getNetworkInitiators(record);
  if (initiators.length !== 1 || initiators[0] !== record.documentURL) {
    // Depends on some other script.
    return false;
  }
  return true;
}

/**
 * Finds requests for tags that could have been loaded statically but were not.
 * @param {LH.Artifacts} artifacts
 * @param {LH.Audit.Context} context
 * @return {Promise<NetworkRequest[]>}
 */
async function findStaticallyLoadableTags(artifacts, context) {
  const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
  const trace = artifacts.traces[Audit.DEFAULT_PASS];

  const tagReqs = [];

  // Next add any scripts that appear that they can be loaded statically based
  // on page analysis.
  const criticalRequests =
    await computeAdRequestWaterfall(trace, devtoolsLog, context);
  for (const {record} of criticalRequests) {
    if (!record || record.resourceType !== 'Script') {
      // Don't count resources that aren't scripts.
      continue;
    }
    if (initiatedByInlineScript(record) ||
      STATICALLY_LOADABLE_TAGS.find((t) => record.url.match(t))) {
      tagReqs.push(record);
    }
  }
  return tagReqs;
}

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
    const tagReqs = await findStaticallyLoadableTags(artifacts, context);
    if (!tagReqs.length) {
      return auditNotApplicable.NoTag;
    }

    const seenUrls = new Set();
    const tableView = [];

    const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const trace = artifacts.traces[Audit.DEFAULT_PASS];
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
      numericUnit: 'unitless',
      details: StaticAdTags.makeTableDetails(HEADINGS, tableView),
    };
  }
}

module.exports = StaticAdTags;
module.exports.UIStrings = UIStrings;
