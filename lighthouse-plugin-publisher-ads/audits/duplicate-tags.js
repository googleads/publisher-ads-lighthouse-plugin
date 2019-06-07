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
const util = require('util');
const {auditNotApplicable} = require('../utils/builder');
const {AUDITS, NOT_APPLICABLE} = require('../messages/messages.js');
const {Audit} = require('lighthouse');
const {containsAnySubstring} = require('../utils/resource-classification');
const {URL} = require('url');

const id = 'duplicate-tags';
const {
  title,
  failureTitle,
  description,
  displayValue,
  failureDisplayValue,
  headings,
} = AUDITS[id];

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
  {key: 'script', itemType: 'url', text: headings.script},
  {key: 'numReqs', itemType: 'text', text: headings.numReqs},
  {key: 'frameId', itemType: 'text', text: headings.frameId},
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
      id,
      title,
      failureTitle,
      description,
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
      return auditNotApplicable(NOT_APPLICABLE.NO_TAGS);
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

    const pluralEnding = dups.length == 1 ? '' : 's';
    return {
      numericValue: dups.length,
      score: dups.length ? 0 : 1,
      details: DuplicateTags.makeTableDetails(HEADINGS, dups),
      displayValue: dups.length ?
        util.format(failureDisplayValue, dups.length, pluralEnding) :
        displayValue,
    };
  }
}

module.exports = DuplicateTags;
