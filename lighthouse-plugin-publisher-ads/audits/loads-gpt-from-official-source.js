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

const i18n = require('lighthouse/lighthouse-core/lib/i18n/i18n.js');
const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records.js');
const {auditNotApplicable} = require('../messages/common-strings');
const {Audit} = require('lighthouse');
const {isGptTag} = require('../utils/resource-classification');
const {URL} = require('url');

const UIStrings = {
  title: 'GPT tag is loaded from an official source',
  failureTitle: 'Load GPT from an official source',
  description:
  'Load GPT from \'securepubads.g.doubleclick.net\' for standard ' +
  'integrations or from \'pagead2.googlesyndication.com\' for limited ads. ' +
  '[Learn more](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/loads-gpt-from-official-source' +
  ').',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

/**
 * Simple audit that checks if gpt is loaded over from updated host.
 */
class LoadsGptFromOfficalSource extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id: 'loads-gpt-from-official-source',
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
    const passed = [
      'securepubads.g.doubleclick.net',
      'pagead2.googlesyndication.com',
    ].includes(gptUrl.host);
    return {
      score: Number(passed),
      numericValue: Number(!passed),
      numericUnit: 'unitless',
    };
  }
}

module.exports = LoadsGptFromOfficalSource;
module.exports.UIStrings = UIStrings;
