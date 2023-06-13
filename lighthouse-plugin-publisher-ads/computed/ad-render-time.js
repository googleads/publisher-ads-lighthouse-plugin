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

import AdLanternMetric from './ad-lantern-metric.js';

import ComputedMetric from 'lighthouse/core/computed/metrics/metric.js';
import {makeComputedArtifact} from 'lighthouse/core/computed/computed-artifact.js';

import {getPageStartTime, getImpressionStartTime} from '../utils/network-timing.js';
import {isImpressionPing} from '../utils/resource-classification.js';

// @ts-ignore
// eslint-disable-next-line max-len
/** @typedef {import('lighthouse/core/lib/dependency-graph/base-node.js').Node} Node */

/** Computes simulated first ad render time using Lantern. */
class LanternAdRenderTime extends AdLanternMetric {
  /**
   * @param {LH.Gatherer.Simulation.Result} simulationResult
   * @param {Object} extras
   * @return {LH.Gatherer.Simulation.Result}
   * @override
   */
  static getEstimateFromSimulation(simulationResult, extras) {
    const {nodeTimings} = simulationResult;
    const timeInMs = AdLanternMetric.findNetworkTiming(
      nodeTimings,
      (req) => !!req.url && isImpressionPing(new URL(req.url))).startTime;
    return {timeInMs, nodeTimings};
  }
}

// Decorate the class.
const ComputedLanternAdRenderTime = makeComputedArtifact(LanternAdRenderTime, ['devtoolsLog', 'gatherContext', 'settings', 'simulator', 'trace', 'URL']);

/** Computes the first ad render time metric. */
class AdRenderTime extends ComputedMetric {
  /**
   * @param {LH.Artifacts.MetricComputationData} data
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Artifacts.LanternMetric>}
   */
  static async computeSimulatedMetric(data, context) {
    return ComputedLanternAdRenderTime.request(data, context);
  }

  /**
   * @param {LH.Artifacts.MetricComputationData} data
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Artifacts.Metric>}
   */
  static async computeObservedMetric(data, context) {
    const {networkRecords} = data;
    const pageStartTime = getPageStartTime(networkRecords);
    const impressionStartTime = getImpressionStartTime(networkRecords);
    const firstPaintMs = (impressionStartTime - pageStartTime) * 1000;
    return Promise.resolve({timing: firstPaintMs});
  }
}

// Decorate the class.
const ComputedAdRenderTime = makeComputedArtifact(AdRenderTime, ['devtoolsLog', 'gatherContext', 'settings', 'simulator', 'trace', 'URL']);

export default ComputedAdRenderTime;

