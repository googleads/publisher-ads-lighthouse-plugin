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

// @ts-ignore
import ComputedMetric from 'lighthouse/core/computed/metrics/metric.js';

// @ts-ignore
import {makeComputedArtifact} from 'lighthouse/core/computed/computed-artifact.js';

import {getPageStartTime, getTagEndTime} from '../utils/network-timing.js';
import {isImplTag} from '../utils/resource-classification.js';

// @ts-ignore
// eslint-disable-next-line max-len
/** @typedef {import('lighthouse/core/lib/dependency-graph/base-node.js').Node} Node */

/** Computes simulated tag load time using Lantern. */
class LanternTagLoadTime extends AdLanternMetric {
  /**
   * @param {LH.Gatherer.Simulation.Result} simulationResult
   * @param {Object} extras
   * @return {LH.Gatherer.Simulation.Result}
   * @override
   */
  static getEstimateFromSimulation(simulationResult, extras) {
    const {nodeTimings} = simulationResult;
    const timeInMs = AdLanternMetric.findNetworkTiming(
      nodeTimings, (req) => !!req.url && isImplTag(new URL(req.url))).endTime;
    return {timeInMs, nodeTimings};
  }
}

// Decorate the class.
const ComputedLanternTagLoadTime = makeComputedArtifact(LanternTagLoadTime, ['devtoolsLog', 'gatherContext', 'settings', 'simulator', 'trace', 'URL']);

/** Computes the tag load time metric. */
class TagLoadTime extends ComputedMetric {
  /**
   * @param {LH.Artifacts.MetricComputationData} data
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Artifacts.LanternMetric>}
   */
  static async computeSimulatedMetric(data, context) {
    return ComputedLanternTagLoadTime.request(data, context);
  }

  /**
   * @param {LH.Artifacts.MetricComputationData} data
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Artifacts.Metric>}
   */
  static async computeObservedMetric(data, context) {
    const {networkRecords} = data;
    const pageStartTime = getPageStartTime(networkRecords);
    const tagEndTime = getTagEndTime(networkRecords);
    const tagLoadMs = (tagEndTime - pageStartTime) * 1000;
    return Promise.resolve({timing: tagLoadMs});
  }
}

const ComputedTagLoadTime = makeComputedArtifact(TagLoadTime, ['devtoolsLog', 'gatherContext', 'settings', 'simulator', 'trace', 'URL']);

export default ComputedTagLoadTime;
