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
const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records.js');
const {auditNotApplicable} = require('../messages/common-strings');
const {Audit} = require('lighthouse');
const {isAdTag} = require('../utils/resource-classification');
const UIStrings = {
  title: 'Ad tag is loaded over HTTPS',
  failureTitle: 'Load ad tag over HTTPS',
  description: 'For privacy and security, always load GPT/AdSense over ' +
  'HTTPS. Insecure pages should explicitly request the ad script securely. ' +
  'GPT Example: `<script async ' +
  'src=\"https://securepubads.g.doubleclick.net/tag/js/gpt.js\">` ' +
  'AdSense Example: `<script async ' +
  'src=\"https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js\">`' +
  '. [Learn more](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/loads-ad-tag-over-https' +
  ').',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);


/**
 * Simple audit that checks if GPT/AdSense is loaded over https.
 * Currently based on network logs since it covers statically and dynamically
 * loaded scripts from the main page and iframes.
 */
class LoadsAdTagOverHttps extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id: 'loads-ad-tag-over-https',
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

    const adRequests = networkRecords
        .filter((record) => isAdTag(new URL(record.url)));

    const secureAdRequests = adRequests.filter((request) => request.isSecure);

    /** @type {LH.Audit.Details.DebugData} */
    const details = {
      type: 'debugdata',
      numAdTagHttpReqs: adRequests.length - secureAdRequests.length,
      numAdTagHttpsReqs: secureAdRequests.length,
    };

    if (!adRequests.length) {
      const returnVal = auditNotApplicable.NoTag;
      returnVal.details = details;
      return returnVal;
    }

    // TODO(jonkeller): Add a details table indicating which scripts are loaded
    // over HTTP.
    return {
      numericValue: details.numAdTagHttpReqs,
      score: details.numAdTagHttpReqs ? 0 : 1,
      details,
    };
  }
}

module.exports = LoadsAdTagOverHttps;
module.exports.UIStrings = UIStrings;
