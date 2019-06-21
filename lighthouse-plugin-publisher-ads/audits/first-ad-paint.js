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

const {auditNotApplicable} = require('../utils/builder');
const {AUDITS, NOT_APPLICABLE, WARNINGS, formatMessage} = require('../messages/messages.js');
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
 * Returns the first timestamp of the given event for ad iframes, or 0 if no
 * relevant timing is found.
 * @param {string} eventName
 * @param {LH.TraceEvent[]} traceEvents
 * @param {Set<string>} adFrameIds
 * @return {number}
 */
function getMinEventTime(eventName, traceEvents, adFrameIds) {
  const times = traceEvents
      .filter((e) => e.name == eventName)
      .filter((e) => adFrameIds.has(e.args.frame || ''))
      .map((e) => e.ts);
  return times.length ? Math.min(...times) : 0;
}

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
    const {traceEvents} = artifacts.traces[Audit.DEFAULT_PASS];
    const slots = artifacts.IFrameElements.filter(isGptIframe);
    if (slots.length == 0) {
      context.LighthouseRunWarnings.push(WARNINGS.NO_AD_RENDERED);
      return auditNotApplicable(NOT_APPLICABLE.NO_AD_RENDERED);
    }

    const adFrameIds = new Set(slots.map((s) => s.frame && s.frame.id));

    const adPaintTime =
        getMinEventTime('firstContentfulPaint', traceEvents, adFrameIds) ||
        getMinEventTime('firstPaint', traceEvents, adFrameIds);
    if (!adPaintTime) {
      return auditNotApplicable(NOT_APPLICABLE.NO_AD_RENDERED);
    }

    const {ts: pageNavigationStart} =
      traceEvents.find((e) => e.name == 'navigationStart') || {ts: 0};
    const firstAdPaintMicros = adPaintTime - pageNavigationStart;

    const firstAdPaintSec = firstAdPaintMicros * 1e-6;
    let normalScore =
        Audit.computeLogNormalScore(firstAdPaintSec, PODR, MEDIAN);
    if (normalScore >= 0.9) normalScore = 1;

    return {
      numericValue: firstAdPaintSec,
      score: normalScore,
      displayValue:
        formatMessage(displayValue, {firstAdPaint: firstAdPaintSec}),
    };
  }
}
module.exports = FirstAdPaint;
