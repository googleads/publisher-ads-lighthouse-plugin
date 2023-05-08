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

import {getAdStartTime, getPageStartTime} from '../utils/network-timing.js';
import {isAdRequest} from '../utils/resource-classification.js';

// eslint-disable-next-line max-len
/** @typedef {import('lighthouse/core/lib/dependency-graph/base-node.js').Node} Node */

/** Computes simulated first ad request time using Lantern. */
class LanternAdRequestTime extends AdLanternMetric {
  /**
   * @param {LH.Gatherer.Simulation.Result} simulationResult
   * @param {Object} extras
   * @return {LH.Gatherer.Simulation.Result}
   * @override
   */
  static getEstimateFromSimulation(simulationResult, extras) {
    const {nodeTimings} = simulationResult;
    const timeInMs = AdLanternMetric.findNetworkTiming(
      nodeTimings, isAdRequest).startTime;
    return {timeInMs, nodeTimings};
  }
}

// Decorate the class.
const ComputedLanternAdRequestTime = makeComputedArtifact(LanternAdRequestTime, ['devtoolsLog', 'gatherContext', 'settings', 'simulator', 'trace', 'URL']);

/** Computes time to the first ad request. */
class AdRequestTime extends ComputedMetric {
  /**
   * @param {LH.Artifacts.MetricComputationData} data
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Artifacts.LanternMetric>}
   */
  static async computeSimulatedMetric(data, context) {
    return ComputedLanternAdRequestTime.request(data, context);
  }

  /**
   * @param {LH.Artifacts.MetricComputationData} data
   * @return {Promise<LH.Artifacts.Metric>}
   */
  static async computeObservedMetric(data) {
    const {networkRecords} = data;
    const pageStartTime = getPageStartTime(networkRecords);
    const adStartTime = getAdStartTime(networkRecords);
    const adRequestTimeMs = (adStartTime - pageStartTime) * 1000;
    return Promise.resolve({timing: adRequestTimeMs});
  }
}

// Decorate the class.
const ComputedAdRequestTime = makeComputedArtifact(AdRequestTime, ['devtoolsLog', 'gatherContext', 'settings', 'simulator', 'trace', 'URL']);

export default ComputedAdRequestTime;
