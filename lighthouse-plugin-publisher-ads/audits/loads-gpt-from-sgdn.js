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
const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records');
const {auditNotApplicable} = require('../messages/common-strings');
const {Audit} = require('lighthouse');
const {isGptTag, isGptImplTag} = require('../utils/resource-classification');
const {URL} = require('url');

const UIStrings = {
  title: 'GPT tag is loaded from recommended host',
  failureTitle: 'Load GPT from recommended host',
  description: 'Load GPT from \'securepubads.g.doubleclick.net\' to reduce ' +
  'GPT load time. By loading GPT from the same host as ad requests, browsers ' +
  'can avoid an additional DNS lookup and HTTP connection. Example: `' +
  '<script async src=\"https://securepubads.g.doubleclick.net/tag/js/gpt.js\">' +
  '`. [Learn more](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/loads-gpt-from-sgdn' +
  ').',
  failureDisplayValue: 'Up to {timeInMs, number, seconds} s tag load time speed-up',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

/**
 * Simple audit that checks if gpt is loaded over from updated host.
 */
class LoadsGptFromSgdn extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id: 'loads-gpt-from-sgdn',
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
    const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const networkRecords = await NetworkRecords.request(devtoolsLog, context);
    const gptUrl = networkRecords.map((r) => new URL(r.url)).find(isGptTag);
    if (!gptUrl) {
      return auditNotApplicable.NoGpt;
    }

    const implRecord = networkRecords.find((r) => isGptImplTag(new URL(r.url)));
    const opportunityMs = implRecord ?
      Math.max(implRecord.timing.dnsEnd, implRecord.timing.connectEnd) : 0;

    const failed = gptUrl.host !== 'securepubads.g.doubleclick.net';
    let displayValue = '';
    if (failed && opportunityMs > 0) {
      displayValue = str_(
        UIStrings.failureDisplayValue, {timeInMs: opportunityMs});
    }
    return {
      score: failed ? 0 : 1,
      displayValue,
    };
  }
}

module.exports = LoadsGptFromSgdn;
module.exports.UIStrings = UIStrings;
