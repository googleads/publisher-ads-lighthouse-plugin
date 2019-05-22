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

// @ts-ignore
const ComputedMetric = require('lighthouse/lighthouse-core/computed/metrics/metric');
// @ts-ignore
const makeComputedArtifact = require('lighthouse/lighthouse-core/computed/computed-artifact');
const {isGptIframe} = require('../utils/resource-classification');

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

/** Computes the first ad paint time on the page */
class AdPaintTime extends ComputedMetric {
  /**
   * @param {LH.Artifacts.MetricComputationData} data
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Artifacts.Metric>}
   * @override
   */
  static computeSimulatedMetric(data, context) {
    throw new Error('Simulated ad paint time not implemented');
  }

  /**
   * @param {MetricComputationData} data
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Artifacts.Metric>}
   * @override
   */
  static async computeObservedMetric(data, context) {
    const {iframeElements, trace: {traceEvents}} = data;
    if (!iframeElements) {
      return Promise.resolve({timing: -1});
    }

    const slots = iframeElements.filter(isGptIframe);
    if (!slots.length) {
      return Promise.resolve({timing: -1});
    }

    const adFrameIds = new Set(slots.map((s) => s.frame && s.frame.id));
    const adPaintTime =
        getMinEventTime('firstContentfulPaint', traceEvents, adFrameIds) ||
        getMinEventTime('firstPaint', traceEvents, adFrameIds);
    const {ts: pageNavigationStart} =
      traceEvents.find((e) => e.name == 'navigationStart') || {ts: 0};
    const timing = (adPaintTime - pageNavigationStart) * 1e-6;
    return Promise.resolve({timing});
  }
}

// Decorate the class.
// @ts-ignore Allow reassignment for decoration.
// eslint-disable-next-line no-class-assign
AdPaintTime = makeComputedArtifact(AdPaintTime);

module.exports = AdPaintTime;

