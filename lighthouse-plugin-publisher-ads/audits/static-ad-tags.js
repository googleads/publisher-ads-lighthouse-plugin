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
const {getAdCriticalGraph} = require('../utils/graph');
const {getScriptEvaluationTimes} = require('../utils/network-timing');

/** @typedef {LH.Artifacts.NetworkRequest} NetworkRequest */
/** @typedef {LH.Gatherer.Simulation.NodeTiming} NodeTiming */

// Don't bother failing on scripts that are dynamically inserted but load
// quickly.
const MINIMUM_LOAD_TIME_MS = 400;

const UIStrings = {
  title: 'Ad tags are loaded statically',
  failureTitle: 'Load ad tags statically',
  description: 'Tags loaded dynamically are not visible to the browser ' +
  'preloader. Consider using a static tag or `<link rel=\"preload\">` so the ' +
  'browser may load tag sooner. [Learn more](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/static-ad-tags' +
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

/**
 * Returns the estimated opportunity in loading GPT statically.
 * @param {LH.Artifacts.NetworkRequest[]} tagRequests
 * @param {LH.Artifacts.NetworkRequest[]} networkRecords
 * @return {number}
 */
function quantifyOpportunityMs(tagRequests, networkRecords) {
  // The first HTML-initiated request is the best possible load time.
  const firstResource = networkRecords.find((r) =>
    ['parser', 'preload'].includes(r.initiator.type) ||
    r.resourceType == 'Script');
  if (!firstResource) {
    return 0;
  }

  const tags = new Set(tagRequests);
  const loadTimes = networkRecords
      .filter((r) => tags.has(r.initiatorRequest))
      .map((r) => r.startTime - firstResource.startTime);

  return Math.min(...loadTimes) * 1e3;
}

const TAGS = [
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
      id: 'static-ad-tags',
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
    const tagReqs = networkRecords
        .filter((req) => TAGS.find((t) => req.url.match(t)));

    const criticalRequests = getAdCriticalGraph(
      networkRecords, trace.traceEvents);
    // Find critical scripts that were loaded by inline scripts, which could
    // have been loaded statically.
    for (const req of criticalRequests) {
      if (req.resourceType !== 'Script') {
        // Don't count resources that aren't scripts.
        continue;
      }
      if (req.initiator.type !== 'script') {
        // Don't count resources that weren't loaded by inline scripts.
        continue;
      }
      const initiators = PageDependencyGraph.getNetworkInitiators(req);
      if (initiators.length !== 1 || initiators[0] !== req.documentURL) {
        // We can't recommend static loading of requests that depend on other
        // scripts.
        continue;
      }
      tagReqs.push(req);
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
        const loadTime = scriptTimes.get(tag.url);
        if (loadTime < MINIMUM_LOAD_TIME_MS) {
          continue;
        }
        tableView.push({
          url: tag.url,
          loadTime,
        });
      }
    }
    const failed = tableView.length > 0;
    let displayValue = '';
    if (failed) {
      const opportunity = quantifyOpportunityMs(tagReqs, networkRecords);
      if (opportunity > 100) {
        displayValue = str_(
          UIStrings.failureDisplayValue, {tags: tableView.length});
      }
    }

    tableView.sort((a, b) => a.loadTime - b.loadTime);
    return {
      displayValue,
      score: Number(!failed),
      numericValue: tableView.length,
      details: StaticAdTags.makeTableDetails(HEADINGS, tableView),
    };
  }
}

module.exports = StaticAdTags;
module.exports.UIStrings = UIStrings;
