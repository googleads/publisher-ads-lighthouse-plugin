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

const ComputedAdRequestTime = require('../computed/ad-request-time');
const ComputedTagLoadTime = require('../computed/tag-load-time');
const {auditNotApplicable} = require('../utils/builder');
const {AUDITS, NOT_APPLICABLE} = require('../messages/messages');
const {Audit} = require('lighthouse');
const {formatMessage} = require('../messages/format');

const id = 'ad-request-from-tag-load';
const {
  title,
  failureTitle,
  description,
  displayValue,
} = AUDITS[id];

// Point of diminishing returns.
const PODR = 0.3; // seconds
const MEDIAN = 1; // seconds

/**
 * Audit to determine time for first ad request relative to tag load.
 */
class AdRequestFromTagLoad extends Audit {
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
      // @ts-ignore
      scoreDisplayMode: Audit.SCORING_MODES.NUMERIC,
      requiredArtifacts: ['devtoolsLogs', 'traces'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts, context) {
    const trace = artifacts.traces[Audit.DEFAULT_PASS];
    const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const metricData = {trace, devtoolsLog, settings: context.settings};

    const {timing: tagEndTime} =
        await ComputedTagLoadTime.request(metricData, context);
    if (!(tagEndTime > 0)) { // Handle NaN, etc.
      return auditNotApplicable(NOT_APPLICABLE.NO_TAG);
    }

    const {timing: adStartTime} =
        await ComputedAdRequestTime.request(metricData, context);
    if (!(adStartTime > 0)) { // Handle NaN, etc.
      return auditNotApplicable(NOT_APPLICABLE.NO_ADS);
    }

    const adReqTimeSec = (adStartTime - tagEndTime) / 1000;

    let normalScore = Audit.computeLogNormalScore(adReqTimeSec, PODR, MEDIAN);

    // Results that have green text should be under passing category.
    if (normalScore >= .9) {
      normalScore = 1;
    }

    return {
      numericValue: adReqTimeSec,
      score: normalScore,
      displayValue: formatMessage(displayValue, {adReqTime: adReqTimeSec}),
    };
  }
}

module.exports = AdRequestFromTagLoad;
