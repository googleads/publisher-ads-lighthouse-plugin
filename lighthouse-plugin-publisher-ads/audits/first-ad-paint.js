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

const AdPaintTime = require('../computed/ad-paint-time');
const common = require('../messages/common-strings');
const {auditNotApplicable} = require('../utils/builder');
const {Audit} = require('lighthouse');
// @ts-ignore
const i18n = require('lighthouse/lighthouse-core/lib/i18n/i18n.js');

const UIStrings = {
  title: 'Latency of first ad render',
  failureTitle: 'Reduce time to render first ad',
  description: 'This metric measures the time for the first ad iframe to ' +
  'paint from page navigation. [Learn more](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/metrics' +
  ').',
  displayValue: '{firstAdPaint, number, seconds} s',
};

const str_ = i18n.createMessageInstanceIdFn(__filename,
  Object.assign(UIStrings, common.UIStrings));

// Point of diminishing returns.
const PODR = 3.0; // seconds
const MEDIAN = 4.0; // seconds

/**
 * Measures the first ad paint time.
 */
class FirstAdPaint extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    // @ts-ignore
    return {
      id: 'first-ad-paint',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      // @ts-ignore
      scoreDisplayMode: Audit.SCORING_MODES.NUMERIC,
      // @ts-ignore
      requiredArtifacts: ['devtoolsLogs', 'traces', 'IFrameElements'],
    };
  }
  /**
   * @param {Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts, context) {
    const trace = artifacts.traces[Audit.DEFAULT_PASS];
    const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const metricData = {
      devtoolsLog,
      trace,
      iframeElements: artifacts.IFrameElements,
      settings: context.settings,
    };
    const {timing} = await AdPaintTime.request(metricData, context);

    if (!(timing > 0)) { // Handle NaN, etc.
      context.LighthouseRunWarnings.push(
        str_(common.UIStrings.WARNINGS__NO_AD_RENDERED));
      return auditNotApplicable(
        str_(common.UIStrings.NOT_APPLICABLE__NO_AD_RENDERED));
    }

    const adPaintTimeSec = timing / 1000;
    let normalScore =
        Audit.computeLogNormalScore(adPaintTimeSec, PODR, MEDIAN);
    if (normalScore >= 0.9) normalScore = 1;

    return {
      numericValue: adPaintTimeSec,
      score: normalScore,
      displayValue:
        str_(UIStrings.displayValue, {firstAdPaint: adPaintTimeSec}),
    };
  }
}
module.exports = FirstAdPaint;
module.exports.UIStrings = UIStrings;
