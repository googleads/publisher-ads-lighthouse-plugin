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
const {Audit} = require('lighthouse');
const {getScriptUrl} = require('../utils/network-timing');
const {isGptIframe, isGptImplTag} = require('../utils/resource-classification');

const UIStrings = {
  title: 'Cumulative ad shift',
  failureTitle: 'Reduce ad-related layout shift',
  description: 'Measures [layout shifts](https://web.dev/cls) that were ' +
    'caused by ads or happened near ads. Avoid layout shifts to improve ' +
    'user experience.',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

/**
 * @param {number[]} points
 * @return {{left: number, top: number, right: number, bottom: number,
 *     height: number, width: number}}
 */
function toRect(points) {
  return {
    left: points[0],
    top: points[1],
    width: points[2],
    height: points[3],
    right: points[0] + points[2],
    bottom: points[1] + points[3],
  };
}

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
   * @return {LH.Audit.ScoreOptions}
    */
  static get defaultOptions() {
    // TODO tune this
    return {
      p10: 0.05,
      median: 0.2,
    };
  }

  /**
   * @param {LH.TraceEvent} shiftEvent
   * @param {Artifacts['IFrameElement'][]} ads
   */
  static isAdShift(shiftEvent, ads) {
    if (!shiftEvent.args || !shiftEvent.args.data) {
      return false;
    }
    for (const ad of ads) {
      // Names come from external JSON
      // eslint-disable-next-line camelcase
      for (const node of shiftEvent.args.data.impacted_nodes || []) {
        // eslint-disable-next-line camelcase
        const /* number[] */ oldRect = node.old_rect || [];
        const shift = toRect(oldRect);
        const adRect = ad.clientRect;

        const overlapX =
          !(shift.right < adRect.left || adRect.right < shift.left);
        const overlapY =
          !(shift.bottom < adRect.top || adRect.bottom < shift.top);
        if (overlapX && overlapY) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Computes the ad shift score for the page.
   * @param {LH.TraceEvent[]} traceEvents
   * @param {Artifacts['IFrameElement'][]} iframes
   */
  static compute(traceEvents, iframes) {
    const shiftEvents = traceEvents
        .filter((e) => e.name === 'LayoutShift');
    const gptLoadEvent =
      traceEvents.find((e) => isGptImplTag(getScriptUrl(e) || '')) ||
      {ts: Infinity};
    const gptLoadTs = gptLoadEvent.ts || Infinity;

    // Maybe we should look at the parent elements (created by the publisher and
    // passed to the ad tag) rather than the iframe itself.
    const ads = iframes.filter(isGptIframe);

    let cumulativeShift = 0;
    let numShifts = 0;
    let cumulativeAdShift = 0;
    let numAdShifts = 0;
    let cumulativePreGptAdShift = 0;
    let numPreGptAdShifts = 0;
    for (const event of shiftEvents) {
      if (!event.args || !event.args.data || !event.args.data.is_main_frame) {
        continue;
      }
      // @ts-ignore
      cumulativeShift += event.args.data.score;
      numShifts++;
      if (this.isAdShift(event, ads)) {
        // @ts-ignore
        cumulativeAdShift += event.args.data.score;
        numAdShifts++;
        if (event.ts < gptLoadTs) {
          // @ts-ignore
          cumulativePreGptAdShift += event.args.data.score;
          numPreGptAdShifts++;
        }
      }
    }
    return {
      cumulativeShift,
      numShifts,
      cumulativeAdShift,
      numAdShifts,
      cumulativePreGptAdShift,
      numPreGptAdShifts,
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts, context) {
    const trace = artifacts.traces[Audit.DEFAULT_PASS];
    const details = this.compute(trace.traceEvents, artifacts.IFrameElements);
    console.log(details);
    const rawScore = details.cumulativeAdShift;
    return {
      numericValue: rawScore,
      numericUnit: 'unitless',
      score: Audit.computeLogNormalScore(context.options, rawScore),
      displayValue: rawScore.toLocaleString(context.settings.locale),
      // @ts-ignore Add more fields for logging
      details,
    };
  }
}

module.exports = CumulativeAdShift;
module.exports.UIStrings = UIStrings;
