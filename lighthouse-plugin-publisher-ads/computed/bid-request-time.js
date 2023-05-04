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

import {getAdStartTime, getBidStartTime, getPageStartTime} from '../utils/network-timing.js';
import {isAdRequest, isBidRequest} from '../utils/resource-classification.js';

// eslint-disable-next-line max-len
/** @typedef {import('lighthouse/core/lib/dependency-graph/base-node.js').Node} Node */

/** Computes simulated first ad request time using Lantern. */
class LanternBidRequestTime extends AdLanternMetric {
  /**
   * @param {LH.Gatherer.Simulation.Result} simulationResult
   * @param {Object} extras
   * @return {LH.Gatherer.Simulation.Result}
   * @override
   */
  static getEstimateFromSimulation(simulationResult, extras) {
    const {nodeTimings} = simulationResult;
    const bidTimeInMs = AdLanternMetric.findNetworkTiming(
      nodeTimings, isBidRequest).startTime;
    const adRequestTimeMs = AdLanternMetric.findNetworkTiming(
      nodeTimings, isAdRequest).startTime;
    if (bidTimeInMs > adRequestTimeMs) {
      return {timeInMs: -1, nodeTimings};
    }
    return {timeInMs: bidTimeInMs, nodeTimings};
  }
}

// Decorate the class.
const ComputedLanternBidRequestTime = makeComputedArtifact(LanternBidRequestTime, ['devtoolsLog', 'gatherContext', 'settings', 'simulator', 'trace', 'URL']);

/** Computes time to the first ad request. */
class BidRequestTime extends ComputedMetric {
  /**
   * @param {LH.Artifacts.MetricComputationData} data
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Artifacts.LanternMetric>}
   */
  static async computeSimulatedMetric(data, context) {
    return ComputedLanternBidRequestTime.request(data, context);
  }

  /**
   * @param {LH.Artifacts.MetricComputationData} data
   * @return {Promise<LH.Artifacts.Metric>}
   */
  static async computeObservedMetric(data) {
    const {networkRecords} = data;
    const pageStartTime = getPageStartTime(networkRecords);
    const bidStartTime = getBidStartTime(networkRecords);
    const adStartTime = getAdStartTime(networkRecords);
    if (adStartTime < bidStartTime) {
      return {timing: -1};
    }
    const bidRequestTimeMs = (bidStartTime - pageStartTime) * 1000;
    return {timing: bidRequestTimeMs};
  }
}

// Decorate the class.
const ComputedBidRequestTime = makeComputedArtifact(BidRequestTime, ['devtoolsLog', 'gatherContext', 'settings', 'simulator', 'trace', 'URL']);

export default ComputedBidRequestTime;
