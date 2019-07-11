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

const i18n = require('lighthouse/lighthouse-core/lib/i18n/i18n');
const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records');
const util = require('util');
const {auditNotApplicable} = require('../messages/common-strings');
const {Audit} = require('lighthouse');
const {isGptTag} = require('../utils/resource-classification');
const {URL} = require('url');

const UIStrings = {
  title: 'GPT tag is loaded over HTTPS',
  failureTitle: 'Load GPT over HTTPS',
  description: 'For privacy and security, always load GPT over HTTPS. ' +
  'Insecure pages should explicitly request the GPT script securely. Example:' +
  '`<script async src=\"https://securepubads.g.doubleclick.net/tag/js/gpt.js\"' +
  '>`. [Learn more](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/loads-gpt-over-https' +
  ').',
  failureDisplayValue: 'Load gpt.js over HTTPS',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);


/**
 * Simple audit that checks if gpt is loaded over https.
 * Currently based on network logs since it covers statically and dynamically
 * loaded scripts from the main page and iframes.
 */
class LoadsGptOverHttps extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id: 'loads-gpt-over-https',
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

    const pageReq = networkRecords.find((record) => record.statusCode == 200);
    if (!pageReq) {
      return auditNotApplicable.NoRecords;
    }

    const gptRequests = networkRecords
        .filter((record) => isGptTag(new URL(record.url)));

    const secureGptRequests = gptRequests.filter((request) => request.isSecure);

    /** @type {LH.Audit.Details.DebugData} */
    const details = {
      type: 'debugdata',
      numGptHttpReqs: gptRequests.length - secureGptRequests.length,
      numGptHttpsReqs: secureGptRequests.length,
    };

    if (!gptRequests.length) {
      const returnVal = auditNotApplicable.NoGpt;
      returnVal.details = details;
      return returnVal;
    }

    return {
      numericValue: details.numGptHttpReqs,
      score: details.numGptHttpReqs ? 0 : 1,
      displayValue: details.numGptHttpReqs ?
        util.format(
          str_(UIStrings.failureDisplayValue), details.numGptHttpReqs) :
        '',
      details,
    };
  }
}

module.exports = LoadsGptOverHttps;
module.exports.UIStrings = UIStrings;
