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

const NetworkRecords = require('lighthouse/lighthouse-core/gather/computed/network-records');
const {auditNotApplicable} = require('../utils/builder');
const {Audit} = require('lighthouse');
const {isGptTag} = require('../utils/resource-classification');
const {URL} = require('url');

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
      title: 'Uses HTTPS to load GPT',
      failureTitle: 'GPT tag is loaded insecurely',
      description: 'For privacy and security always load GPT over HTTPS. With' +
        ' insecure pages explicitly request the GPT script securely. Example:' +
        '`<script async="async" ' +
        'src="https://www.googletagservices.com/tag/js/gpt.js">`. ' +
        '[Learn more.]' +
        '(https://ad-speed-insights.appspot.com/#https)',
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
      return auditNotApplicable('No successful network records');
    }

    const gptRequests = networkRecords
        .filter((record) => isGptTag(new URL(record.url)));

    const secureGptRequests = gptRequests.filter((request) => request.isSecure);

    const details = {
      numGptHttpReqs: gptRequests.length - secureGptRequests.length,
      numGptHttpsReqs: secureGptRequests.length,
    };

    if (!gptRequests.length) {
      const returnVal = auditNotApplicable('GPT not requested');
      returnVal.details = details;
      return returnVal;
    }

    const pluralEnding = details.numGptHttpReqs == 1 ? '' : 's';
    return {
      rawValue: details.numGptHttpReqs,
      score: details.numGptHttpReqs ? 0 : 1,
      displayValue: details.numGptHttpReqs ?
        `${details.numGptHttpReqs} unsafe request${pluralEnding}` : '',
      details,
    };
  }
}

module.exports = LoadsGptOverHttps;
