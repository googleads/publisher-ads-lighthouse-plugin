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

const i18n = require('lighthouse/lighthouse-core/lib/i18n/i18n.js');
const {auditNotApplicable} = require('../messages/common-strings');
const {Audit} = require('lighthouse');
const {getScriptUrl} = require('../utils/network-timing');
const {isAdIframe, isAdRelated, isImplTag} = require('../utils/resource-classification');
const {overlaps, toClientRect} = require('../utils/geometry');

const UIStrings = {
  title: 'Cumulative ad shift',
  failureTitle: 'Reduce ad-related layout shift',
  description:
      'Measures layout shifts that were caused by ads or happened near ads. ' +
          'Reducing cumulative ad-related layout shift will improve user ' +
          'experience. [Learn more]' +
          '(https://developers.google.com/publisher-ads-audits/reference/audits/cumulative-ad-shift).',
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
      requiredArtifacts: ['traces', 'IFrameElements'],
    };
  }

  /**
   * @return {LH.Audit.ScoreOptions}
   */
  static get defaultOptions() {
    // TODO tune this
    return {
      p10: 0.05,
      median: 0.25,
    };
  }

  /**
   * @param {LH.TraceEvent} shiftEvent
   * @param {Artifacts['IFrameElement'][]} ads
   * @return {boolean}
   */
  static isAdExpansion(shiftEvent, ads) {
    if (!shiftEvent.args || !shiftEvent.args.data) {
      return false;
    }
    // Names come from external JSON
    // eslint-disable-next-line camelcase
    for (const node of shiftEvent.args.data.impacted_nodes || []) {
      // eslint-disable-next-line camelcase
      const oldRect = toClientRect(node.old_rect || []);
      const newRect = toClientRect(node.new_rect || []);
      if (oldRect.top > newRect.top || oldRect.height !== newRect.height) {
        // It wasn't a downward shift. I.e. this element wasn't pushed down
        // by an ad.
        continue;
      }
      for (const ad of ads) {
        const adRect = ad.clientRect;
        if ((oldRect.top >= adRect.top || newRect.top >= adRect.bottom) &&
            overlaps(oldRect, adRect)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * @param {LH.TraceEvent} shiftEvent
   * @param {LH.TraceEvent[]} tasks
   * @return {boolean}
   */
  static isAttributableToTask(shiftEvent, tasks) {
    if (!shiftEvent.args || !shiftEvent.args.data) {
      return false;
    }
    const timeWindow = 50 * 1000; // 50 milliseconds in microseconds
    // Check if any task occurred in the previous frame.
    const attributedTask = tasks.find((t) =>
      t.ts < shiftEvent.ts && (shiftEvent.ts - t.ts) < timeWindow);
    return !!attributedTask;
  }

  /**
   * Computes the ad shift score for the page.
   * @param {LH.TraceEvent[]} shiftEvents
   * @param {LH.TraceEvent[]} scriptEvents
   * @param {Artifacts['IFrameElement'][]} ads
   * @param {number} tagLoadTs
   */
  static compute(shiftEvents, scriptEvents, ads, tagLoadTs) {
    let cumulativeShift = 0;
    let numShifts = 0;
    let cumulativeAdShift = 0;
    let numAdShifts = 0;
    let cumulativePreImplTagAdShift = 0;
    let numPreImplTagAdShifts = 0;

    for (const event of shiftEvents) {
      if (!event.args || !event.args.data || !event.args.data.is_main_frame) {
        continue;
      }
      // @ts-ignore
      cumulativeShift += event.args.data.score;
      numShifts++;
      if (this.isAdExpansion(event, ads) ||
          this.isAttributableToTask(event, scriptEvents)) {
        // @ts-ignore
        cumulativeAdShift += event.args.data.score;
        numAdShifts++;
        if (event.ts < tagLoadTs) {
          // @ts-ignore
          cumulativePreImplTagAdShift += event.args.data.score;
          numPreImplTagAdShifts++;
        }
      }
    }
    return {
      cumulativeShift,
      numShifts,
      cumulativeAdShift,
      numAdShifts,
      cumulativePreImplTagAdShift,
      numPreImplTagAdShifts,
    };
  }

  /**
   * Returns a list of layout shift events within the greatest session window.
   * @param {LH.TraceEvent[]} traceEvents
   * @return {LH.TraceEvent[]}
   */
  static getLayoutShiftEventsByWindow(traceEvents) {
    const gapMicros = 1 * 1e6; // 1 second
    const windowLimitMicros = 5 * 1e6; // 5 seconds

    let maxCumulativeScore = 0;
    /** @type {LH.TraceEvent[]} */ let maxWindow = [];
    let currentRunningScore = 0;
    /** @type {LH.TraceEvent[]} */ let currentWindow = [];

    for (const currentEvent of traceEvents) {
      if (currentEvent.name !== 'LayoutShift' || !currentEvent.args ||
          !currentEvent.args.data) {
        continue;
      }
      if (currentWindow.length) {
        const firstEvent = currentWindow[0];
        const lastEvent = currentWindow[currentWindow.length - 1];
        if (lastEvent.ts - firstEvent.ts > windowLimitMicros ||
            currentEvent.ts - lastEvent.ts > gapMicros) {
          if (currentRunningScore > maxCumulativeScore) {
            maxWindow = currentWindow;
            maxCumulativeScore = currentRunningScore;
          }
          currentWindow = [];
          currentRunningScore = 0;
        }
      }
      currentWindow.push(currentEvent);
      const data = currentEvent.args.data;
      currentRunningScore += data.weighted_score_delta || data.score || 0;
    }
    if (!maxWindow.length) {
      maxWindow = currentWindow;
    }
    return maxWindow;
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts, context) {
    const trace = artifacts.traces[Audit.DEFAULT_PASS];
    const shiftEvents = this.getLayoutShiftEventsByWindow(trace.traceEvents);
    if (!shiftEvents.length) {
      return auditNotApplicable.NoLayoutShifts;
    }
    const scriptEvents =
        trace.traceEvents.filter((e) => isAdRelated(getScriptUrl(e) || ''));

    const tagLoadEvent =
        scriptEvents.find((e) => isImplTag(getScriptUrl(e) || '')) ||
        {ts: Infinity};

    // Maybe we should look at the parent elements (created by the publisher and
    // passed to the ad tag) rather than the iframe itself.
    const ads = artifacts.IFrameElements.filter(isAdIframe);
    const details =
        this.compute(shiftEvents, scriptEvents, ads, tagLoadEvent.ts);
    const rawScore = details.cumulativeAdShift;

    if (!ads.length && !rawScore) {
      // TODO count shifts for the container element here.
      return auditNotApplicable.NoAdRendered;
    }

    return {
      numericValue: rawScore,
      numericUnit: 'unitless',
      score: Audit.computeLogNormalScore(
        {p10: context.options.p10, median: context.options.median}, rawScore),
      displayValue: rawScore.toLocaleString(context.settings.locale),
      // @ts-ignore Add more fields for logging
      details,
    };
  }
}

module.exports = CumulativeAdShift;
module.exports.UIStrings = UIStrings;
