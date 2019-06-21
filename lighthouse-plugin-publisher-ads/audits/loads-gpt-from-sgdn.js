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

const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records');
const {auditNotApplicable} = require('../utils/builder');
const {AUDITS, NOT_APPLICABLE} = require('../messages/messages');
const {Audit} = require('lighthouse');
const {isGptTag} = require('../utils/resource-classification');
const {URL} = require('url');

const id = 'loads-gpt-from-sgdn';
const {
  title,
  failureTitle,
  description,
} = AUDITS[id];

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
    const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const networkRecords = await NetworkRecords.request(devtoolsLog, context);
    const gptUrl = networkRecords.map((r) => new URL(r.url)).find(isGptTag);
    if (!gptUrl) {
      return auditNotApplicable(NOT_APPLICABLE.NO_GPT);
    }
    return {
      score: Number(gptUrl.host === 'securepubads.g.doubleclick.net'),
    };
  }
}

module.exports = LoadsGptFromSgdn;
