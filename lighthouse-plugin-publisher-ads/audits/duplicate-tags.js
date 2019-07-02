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

const common = require('../messages/common-strings');
const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records');
const {auditNotApplicable} = require('../utils/builder');
const {Audit} = require('lighthouse');
const {containsAnySubstring} = require('../utils/resource-classification');
const {URL} = require('url');
// @ts-ignore
const i18n = require('lighthouse/lighthouse-core/lib/i18n/i18n.js');

const UIStrings = {
  title: 'No duplicate tags found in any frame',
  failureTitle: 'Load tags only once per frame',
  description: 'Loading a tag more than once in the same frame is redundant ' +
  'and adds overhead without benefit. [Learn more](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/duplicate-tags' +
  ').',
  failureDisplayValue: '{duplicateTags, number} duplicate ' +
  '{duplicateTags, plural, =1 {tag} other {tags}}',
  columnScript: 'Script',
  columnNumReqs: 'Duplicate Requests',
  columnFrameId: 'Frame ID',
};

const str_ = i18n.createMessageInstanceIdFn(__filename,
  Object.assign(UIStrings, common.UIStrings));

const tags = [
  'googletagservices.com/tag/js/gpt.js',
  'securepubads.g.doubleclick.net/tag/js/gpt.js',
  'pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
  'imasdk.googleapis.com/js/sdkloader/ima3.js',
  'google-analytics.com/analytics.js',
];

/**
 * Table headings for audits details sections.
 * @type {LH.Audit.Details.Table['headings']}
 */
const HEADINGS = [
  {key: 'script', itemType: 'url', text: str_(UIStrings.columnScript)},
  {key: 'numReqs', itemType: 'text', text: str_(UIStrings.columnNumReqs)},
  {key: 'frameId', itemType: 'text', text: str_(UIStrings.columnFrameId)},
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
      requiredArtifacts: ['devtoolsLogs'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts, context) {
    const devtoolsLogs = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const networkRecords = await NetworkRecords.request(devtoolsLogs, context);
    const tagReqs = networkRecords
        .filter((record) => containsAnySubstring(record.url, tags));

    if (!tagReqs.length) {
      return auditNotApplicable(str_(common.UIStrings.NOT_APPLICABLE__NO_TAGS));
    }
    /** @type {Object<string, Object<string, number>>} */
    const tagsByFrame = {};
    tagReqs.forEach((record) => {
      const frameId = record.frameId || '';
      // Groups by path to account for scripts hosted on multiple domains.
      const script = new URL(record.url).pathname;
      if (!tagsByFrame[frameId]) {
        tagsByFrame[frameId] = {};
      }
      tagsByFrame[frameId][script] =
          tagsByFrame[frameId][script] ? tagsByFrame[frameId][script] + 1 : 1;
    });

    /** @type {LH.Audit.Details.Table['items']} */
    const dups = [];
    for (const frameId of Object.keys(tagsByFrame)) {
      for (const script of Object.keys(tagsByFrame[frameId])) {
        const numReqs = tagsByFrame[frameId][script];
        if (numReqs > 1) {
          dups.push({script, numReqs, frameId});
        }
      }
    }

    return {
      numericValue: dups.length,
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
