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
const i18n = require('lighthouse/lighthouse-core/lib/i18n/i18n.js');
const {auditNotApplicable} = require('../messages/common-strings');
const {Audit} = require('lighthouse');

const UIStrings = {
  title: 'Latency of first ad request, from tag load',
  failureTitle: 'Reduce latency of first ad request (from tag load)',
  description: 'This metric measures the elapsed time from when the Google ' +
  'Publisher Tag loads until the first ad request is made. [Learn more](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/ad-request-from-tag-load' +
  ').',
  displayValue: '{timeInMs, number, seconds} s',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

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
      id: 'ad-request-from-tag-load',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      // @ts-ignore
      scoreDisplayMode: Audit.SCORING_MODES.NUMERIC,
      requiredArtifacts: ['devtoolsLogs', 'traces'],
    };
  }

  /**
   * @return {{
    *  simulate: LH.Audit.ScoreOptions, provided: LH.Audit.ScoreOptions,
    * }}
    */
  static get defaultOptions() {
    return {
      simulate: {
        p10: 1000,
        median: 2000,
      },
      provided: {
        p10: 450,
        median: 1000,
      },
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
      return auditNotApplicable.NoTag;
    }

    const {timing: adStartTime} =
        await ComputedAdRequestTime.request(metricData, context);
    if (!(adStartTime > 0)) { // Handle NaN, etc.
      return auditNotApplicable.NoAds;
    }

    const adReqTimeMs = (adStartTime - tagEndTime);

    const scoreOptions = context.options[context.settings.throttlingMethod]
       || context.options['provided'];

    return {
      numericValue: adReqTimeMs * 1e-3,
      numericUnit: 'unitless',
      score: Audit.computeLogNormalScore(scoreOptions, adReqTimeMs),
      displayValue: str_(UIStrings.displayValue, {timeInMs: adReqTimeMs}),
    };
  }
}

module.exports = AdRequestFromTagLoad;
module.exports.UIStrings = UIStrings;
