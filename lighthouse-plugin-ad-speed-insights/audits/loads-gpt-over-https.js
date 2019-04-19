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
const {auditNotApplicable} = require('../utils/builder');
const {AUDITS, NOT_APPLICABLE} = require('../messages/en-US.js');
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
    const id = 'loads-gpt-over-https';
    const {title, failureTitle, description} = AUDITS[id];
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

    const pageReq = networkRecords.find((record) => record.statusCode == 200);
    if (!pageReq) {
      return auditNotApplicable(NOT_APPLICABLE.NO_RECORDS);
    }

    const gptRequests = networkRecords
        .filter((record) => isGptTag(new URL(record.url)));

    const secureGptRequests = gptRequests.filter((request) => request.isSecure);

    /** @type {LH.Audit.Details.Diagnostic} */
    const details = {
      type: 'diagnostic',
      numGptHttpReqs: gptRequests.length - secureGptRequests.length,
      numGptHttpsReqs: secureGptRequests.length,
    };

    if (!gptRequests.length) {
      const returnVal = auditNotApplicable(NOT_APPLICABLE.NO_GPT);
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
