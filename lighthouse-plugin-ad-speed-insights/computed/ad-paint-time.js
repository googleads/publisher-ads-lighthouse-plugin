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
const LoadSimulator = require('lighthouse/lighthouse-core/computed/load-simulator');
// @ts-ignore
const makeComputedArtifact = require('lighthouse/lighthouse-core/computed/computed-artifact');
// @ts-ignore
const PageDependencyGraph = require('lighthouse/lighthouse-core/computed/page-dependency-graph');
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

/** Computes the first ad paint time on the page */
class AdPaintTime extends ComputedMetric {
  /**
   * @param {MetricComputationData} data
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Artifacts.LanternMetric>}
   * @override
   */
  static async computeSimulatedMetric(data, context) {
    const {iframeElements, trace, devtoolsLog, settings} = data;
    if (!iframeElements) {
      return Promise.resolve({timing: -1});
    }

    // @ts-ignore
    const documentNode =
        await PageDependencyGraph.request({trace, devtoolsLog}, context);
    const simulator = data.simulator ||
        await LoadSimulator.request({devtoolsLog, settings}, context);

    const slots = iframeElements.filter(isGptIframe);
    if (!slots.length) {
      return Promise.resolve({timing: -1});
    }
    const adFrameIds = new Set(slots.map((s) => s.frame && s.frame.id));

    const isBlockingEvent = /** @param {LH.TraceEvent} event */ (event) =>
      adFrameIds.has(getFrame(event)) && event.name == 'Paint';

    let foundFirstPaint = false;
    const releventGraph = documentNode.cloneWithRelationships((node) => {
      if (node.record) {
        // Blocking resources are either (1) a blocking resources inside an ad
        // or (2) an ad request from the page.
        return adFrameIds.has(node.record.frameId) ?
          node.hasRenderBlockingPriority() :
          isGptAdRequest(node.record);
      }
      const isFirstPaint = !foundFirstPaint &&
          !!(node.childEvents && node.childEvents.find(isBlockingEvent));
      foundFirstPaint = foundFirstPaint || isFirstPaint;
      return isFirstPaint;
    });

    const simulation = foundFirstPaint ?
      simulator.simulate(releventGraph, {}) : {};

    return {
      timing: simulation.timeInMs || -1,
      optimisticEstimate: simulation,
      pessimisticEstimate: simulation,
      optimisticGraph: releventGraph,
      pessimisticGraph: releventGraph,
    };
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
    const timingMs = (adPaintTime - pageNavigationStart) * 1e-3;
    return Promise.resolve({timing: timingMs});
  }
}

// Decorate the class.
// @ts-ignore Allow reassignment for decoration.
// eslint-disable-next-line no-class-assign
AdPaintTime = makeComputedArtifact(AdPaintTime);

module.exports = AdPaintTime;

