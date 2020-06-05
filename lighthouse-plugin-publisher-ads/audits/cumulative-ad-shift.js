// Copyright 2020 Google LLC
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
const {auditNotApplicable} = require('../messages/common-strings');
const {Audit} = require('lighthouse');
const {isGptIframe} = require('../utils/resource-classification');

const UIStrings = {
  title: 'Cumulative ad shift',
  failureTitle: 'Reduce ad-induced layout shift',
  description: 'TODO',
  displayValue: '{timeInMs, number} shifterinos',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

/**
 * Audit to determine time for first ad request relative to page start.
 */
class CumulativeAdShift extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id: 'cumulative-ad-shift',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      // @ts-ignore
      scoreDisplayMode: Audit.SCORING_MODES.NUMERIC,
      requiredArtifacts: ['devtoolsLogs', 'traces', 'IFrameElements'],
    };
  }

  /**
   * @return {{
    *  simulate: LH.Audit.ScoreOptions, provided: LH.Audit.ScoreOptions
    * }}
    */
  static get defaultOptions() {
    // TODO tune this
    return {
      simulate: {
        p10: 8900,
        median: 15500,
      },
      provided: {
        p10: 1900,
        median: 3500,
      },
    };
  }

  static async compute(traceEvents, iframes) {
    const shiftEvents = traceEvents
      .filter(e => e.name === 'LayoutShift')
      .map(e => e.args && e.args.data);;

    const ads = iframes.filter(isGptFrame)

    const adShifts = [];
    for (const shiftEvent of shiftEvents) {
      const [left, top, width, height] = shiftEvent.old_rect;

      for (const ad of ads) {
        const overlapX = Math.max(left, iframe.left) > Math.min(x + width, iframe.right);
        const overlapY = Math.max(top, iframe.top) > Math.min(top + height, iframe.bottom);
        if (overlapX && overlapY) {
          adShifts.push(shiftEvent);
          continue;
        }
      }
    }
    for (const shift of adShifts) {
      console.log(shift);
    }
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
    console.log(trace);
    this.compute(trace.traceEvents, artifacts.IframeElements);

    return {
      numericValue: timing * 1e-3,
      numericUnit: 'millisecond',
      score: Audit.computeLogNormalScore(
        scoreOptions,
        timing
      ),
      displayValue: str_(UIStrings.displayValue, {timeInMs: timing}),
    };
  }
}

module.exports = CumulativeAdShift;
module.exports.UIStrings = UIStrings;
