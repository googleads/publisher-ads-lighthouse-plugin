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
const ComputedMetric = require('lighthouse/lighthouse-core/computed/metrics/metric.js');
// @ts-ignore
const makeComputedArtifact = require('lighthouse/lighthouse-core/computed/computed-artifact.js');
const {getAdStartTime, getPageStartTime} = require('../utils/network-timing');
const {isAdRequest} = require('../utils/resource-classification');

// @ts-ignore
// eslint-disable-next-line max-len
/** @typedef {import('lighthouse/lighthouse-core/lib/dependency-graph/base-node.js').Node} Node */

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
// @ts-ignore Allow reassignment for decoration.
// eslint-disable-next-line no-class-assign
LanternAdRequestTime = makeComputedArtifact(LanternAdRequestTime);

/** Computes time to the first ad request. */
class AdRequestTime extends ComputedMetric {
  /**
   * @param {LH.Artifacts.MetricComputationData} data
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Artifacts.LanternMetric>}
   * @override
   */
  static async computeSimulatedMetric(data, context) {
    // @ts-ignore request does not exist on LanternAdRequestTime
    return LanternAdRequestTime.request(data, context);
  }

  /**
   * @param {LH.Artifacts.MetricComputationData} data
   * @return {Promise<LH.Artifacts.Metric>}
   * @override
   */
  static async computeObservedMetric(data) {
    const {networkRecords} = data;
    const pageStartTime = getPageStartTime(networkRecords);
    const adStartTime = getAdStartTime(networkRecords);
    const adRequestTimeMs = (adStartTime - pageStartTime) * 1000;
    return Promise.resolve({timing: adRequestTimeMs});
  }

  /**
   * @param {unknown} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Artifacts.Metric>}
   */
  static async request(artifacts, context) {
    // Implement request() to make the compiler happy. It will be implemented
    // below with decoration. Long term we should find a good way to have the
    // compiler infer this.
    throw Error('Not implemented -- class not decorated');
  }
}

// Decorate the class.
// @ts-ignore Allow reassignment for decoration.
// eslint-disable-next-line no-class-assign
AdRequestTime = makeComputedArtifact(AdRequestTime);

module.exports = AdRequestTime;
