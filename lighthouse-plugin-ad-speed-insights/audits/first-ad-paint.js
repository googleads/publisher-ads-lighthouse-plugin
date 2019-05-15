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

const util = require('util');
const {auditNotApplicable} = require('../utils/builder');
const {AUDITS, NOT_APPLICABLE} = require('../messages/messages.js');
const {Audit} = require('lighthouse');
const {isGptIframe} = require('../utils/resource-classification');

const id = 'first-ad-paint';
const {
  title,
  failureTitle,
  description,
  displayValue,
} = AUDITS[id];

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
      id,
      title,
      failureTitle,
      description,
      // @ts-ignore
      scoreDisplayMode: Audit.SCORING_MODES.NUMERIC,
      requiredArtifacts: ['devtoolsLogs', 'IFrameElements'],
    };
  }
  /**
   * @param {Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts, context) {
    const trace = artifacts.traces[Audit.DEFAULT_PASS];
    const slots = artifacts.IFrameElements.filter(isGptIframe);
    if (slots.length == 0) {
      return auditNotApplicable(NOT_APPLICABLE.NO_VISIBLE_SLOTS);
    }

    const adFrameIds = new Set(slots.map((s) => s.frame.id));

    const adPaintTimes = trace.traceEvents
        .filter((e) => e.name == 'firstContentfulPaint')
        .filter((e) => adFrameIds.has(e.args.frame))
        .map((e) => e.ts);
    const {ts: pageNavigationStart} =
      trace.traceEvents.find((e) => e.name == 'navigationStart') || {ts: 0};
    const firstAdPaintMicros = Math.min(...adPaintTimes) - pageNavigationStart;

    const firstAdPaintSec = firstAdPaintMicros * 1e-6;
    let normalScore =
        Audit.computeLogNormalScore(firstAdPaintSec, PODR, MEDIAN);
    if (normalScore >= 0.9) normalScore = 1;

    return {
      rawValue: firstAdPaintSec,
      score: normalScore,
      displayValue: util.format(displayValue, firstAdPaintSec.toFixed(2)),
    };
  }
}
module.exports = FirstAdPaint;
