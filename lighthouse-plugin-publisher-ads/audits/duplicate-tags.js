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
// @ts-ignore
const MainResource = require('lighthouse/lighthouse-core/computed/main-resource.js');
const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records.js');
const NetworkRequest = require('lighthouse/lighthouse-core/lib/network-request.js');
const {auditNotApplicable} = require('../messages/common-strings');
const {Audit} = require('lighthouse');
const {containsAnySubstring} = require('../utils/resource-classification');

const UIStrings = {
  title: 'No duplicate tags found',
  failureTitle: 'Load tags only once',
  description: 'Loading a tag more than once in the same page is redundant ' +
  'and adds overhead without benefit. [Learn more](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/duplicate-tags' +
  ').',
  failureDisplayValue: '{duplicateTags, plural, =1 {1 duplicate tag} other {# duplicate tags}}',
  columnScript: 'Script',
  columnNumReqs: 'Duplicate Requests',
  columnFrameId: 'Frame ID',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

const tags = [
  'googletagservices.com/tag/js/gpt.js',
  'securepubads.g.doubleclick.net/tag/js/gpt.js',
  'pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
  'pagead2.googlesyndication.com/pagead/js/show_ads.js',
  'cdn.ampproject.org/v0/amp-ad-0.1.js',
];

/**
 * Table headings for audits details sections.
 * @type {LH.Audit.Details.Table['headings']}
 */
const HEADINGS = [
  {key: 'script', itemType: 'url', text: str_(UIStrings.columnScript)},
  {key: 'numReqs', itemType: 'text', text: str_(UIStrings.columnNumReqs)},
];
/**
 * Simple audit that checks if any specified tags are duplicated within the same
 * frame.
 */
class DuplicateTags extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id: 'duplicate-tags',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      requiredArtifacts: ['devtoolsLogs', 'URL'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts, context) {
    const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const networkRecords = await NetworkRecords.request(devtoolsLog, context);
    const mainResource =
        await MainResource.request({URL: artifacts.URL, devtoolsLog}, context);
    const tagReqs = networkRecords
        .filter((r) => r.frameId === mainResource.frameId)
        .filter((r) => containsAnySubstring(r.url, tags))
        .filter((r) => (r.resourceType === NetworkRequest.TYPES.Script));

    if (!tagReqs.length) {
      return auditNotApplicable.NoTags;
    }
    /** @type {Map<string, number>} */
    const tagCounts = new Map;
    for (const record of tagReqs) {
      // Groups by path to account for scripts hosted on multiple domains.
      const script = new URL(record.url).pathname;
      const count = tagCounts.get(script) || 0;
      tagCounts.set(script, count + 1);
    }
    /** @type {LH.Audit.Details.Table['items']} */
    const dups = [];
    for (const [script, numReqs] of tagCounts) {
      if (numReqs > 1) {
        dups.push({script, numReqs});
      }
    }

    return {
      numericValue: dups.length,
      numericUnit: 'unitless',
      score: dups.length ? 0 : 1,
      details: DuplicateTags.makeTableDetails(HEADINGS, dups),
      displayValue: dups.length ?
        str_(UIStrings.failureDisplayValue, {duplicateTags: dups.length}) :
        '',
    };
  }
}

module.exports = DuplicateTags;
module.exports.UIStrings = UIStrings;
