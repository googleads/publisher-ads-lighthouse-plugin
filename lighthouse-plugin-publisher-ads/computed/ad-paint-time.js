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

const AdLanternMetric = require('./ad-lantern-metric');
// @ts-ignore
const ComputedMetric = require('lighthouse/lighthouse-core/computed/metrics/metric');
// @ts-ignore
const makeComputedArtifact = require('lighthouse/lighthouse-core/computed/computed-artifact');
const {isGptAdRequest, isGptIframe} = require('../utils/resource-classification');

/**
 * Returns the frame ID of the given event, if present.
 * @param {LH.TraceEvent} event
 * @return {?string}
 */
function getFrame(event) {
  // @ts-ignore
  return event.args.frame || event.args.data && event.args.data.frame || null;
}

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
      .filter((e) => adFrameIds.has(getFrame(e) || ''))
      .map((e) => e.ts);
  return times.length ? Math.min(...times) : 0;
}

/**
 * @param {MetricComputationData} data
 * @return {Array<Artifacts['IFrameElement']>}
 */
function getGptIframes(data) {
  const {iframeElements} = data;
  if (!iframeElements) {
    return [];
  }
  return iframeElements.filter(isGptIframe);
}

/** Computes simulated first ad request time using Lantern. */
class LanternAdPaintTime extends AdLanternMetric {
  /**
   * @param {LH.Gatherer.Simulation.Result} simulationResult
   * @param {Object} extras
   * @return {LH.Gatherer.Simulation.Result}
   * @override
   */
  static getEstimateFromSimulation(simulationResult, extras) {
    const {nodeTimings} = simulationResult;
    const {iframes} = extras;
    const adFrameIds = new Set(iframes.map(
      /** @param {Artifacts['IFrameElement']} s */
      (s) => s.frame && s.frame.id));
    const adResponseMs = AdLanternMetric.findNetworkTiming(
      nodeTimings, isGptAdRequest).endTime;
    // TODO: filter out pixels from resources
    const firstAdResource = AdLanternMetric.findNetworkTiming(
      nodeTimings, (request) => adFrameIds.has(request.frameId)).endTime;
    const timeInMs = adResponseMs + firstAdResource;
    return {timeInMs, nodeTimings};
  }
}

// Decorate the class.
// @ts-ignore Allow reassignment for decoration.
// eslint-disable-next-line no-class-assign
LanternAdPaintTime = makeComputedArtifact(LanternAdPaintTime);

/** Computes the first ad paint time on the page */
class AdPaintTime extends ComputedMetric {
  /**
   * @param {MetricComputationData} data
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Artifacts.LanternMetric>}
   * @override
   */
  static async computeSimulatedMetric(data, context) {
    const iframes = getGptIframes(data);
    // @ts-ignore computeMetricWithGraphs is not a property of
    // LanternAdPaintTime.
    return LanternAdPaintTime.computeMetricWithGraphs(data, context, {iframes});
  }

  /**
   * @param {MetricComputationData} data
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Artifacts.Metric>}
   * @override
   */
  static async computeObservedMetric(data, context) {
    const iframes = getGptIframes(data);
    const {trace: {traceEvents}} = data;
    const {ts: pageNavigationStart} =
      traceEvents.find((e) => e.name == 'navigationStart') || {ts: 0};

    if (!iframes.length || !pageNavigationStart) {
      return Promise.resolve({timing: -1});
    }
    const adFrameIds = new Set(iframes.map((s) => s.frame && s.frame.id));
    const adPaintTime =
        getMinEventTime('firstContentfulPaint', traceEvents, adFrameIds) ||
        getMinEventTime('firstPaint', traceEvents, adFrameIds);

    let timingMs = 0;
    if (adPaintTime) {
      timingMs = (adPaintTime - pageNavigationStart) / 1000;
    } else {
      // If we don't find a first paint event in the trace, then fall back to
      // the time of the first request.
      // TODO(warrengm): Search child iframes if there is no paint event in the
      // top frame.
      const {networkRecords} = data;
      // Note that we don't really care about whether this request is paintable
      // or not. This is for two reasons:
      // - Reduce variability due to which ad served.
      // - Not consider factors that are outside the publisher's control.
      //   That is, developers don't choose which ad served.
      const firstRequest = networkRecords.find(
        (r) => adFrameIds.has(r.frameId) && r.resourceType != 'Document');
      if (firstRequest) {
        timingMs = firstRequest.endTime - (pageNavigationStart / 1e6);
      }
    }
    return Promise.resolve({timing: timingMs});
  }
}

// Decorate the class.
// @ts-ignore Allow reassignment for decoration.
// eslint-disable-next-line no-class-assign
AdPaintTime = makeComputedArtifact(AdPaintTime);

module.exports = AdPaintTime;

