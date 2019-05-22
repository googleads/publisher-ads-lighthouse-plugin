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

const {getPageResponseTime, getPageStartTime, getTagEndTime} = require('../utils/network-timing');
const {isImplTag} = require('../utils/resource-classification');
const makeComputedArtifact = require('lighthouse/lighthouse-core/computed/computed-artifact');
const BaseNode = require('lighthouse/lighthouse-core/lib/dependency-graph/base-node');
const ComputedMetric = require('lighthouse/lighthouse-core/computed/metrics/metric');
const LanternMetric = require('lighthouse/lighthouse-core/computed/metrics/lantern-metric');

class LanternTagLoadTime extends LanternMetric {
  /**
   * @return {LH.Gatherer.Simulation.MetricCoefficients}
   */
  static get COEFFICIENTS() {
    return {
      intercept: 0,
      optimistic: 0.5,
      pessimistic: 0.5,
    };
  }

  static getPessimisticGraph(root) {
    return LanternTagLoadTime.getOptimisticGraph(root);
  }

  static getOptimisticGraph(root) {
    const isTagNode = (node) =>
        node.record && node.record.url && isImplTag(new URL(node.record.url));
    return root.cloneWithRelationships(isTagNode);
  }
}

LanternTagLoadTime = makeComputedArtifact(LanternTagLoadTime);

class TagLoadTime extends ComputedMetric {
  static computeSimulatedMetric(data, context) {
    return LanternTagLoadTime.request(data, context);
  }

  /**
   * @param {LH.Artifacts.MetricComputationData} data
   * @return {Promise<LH.Artifacts.Metric>}
   */
  static async computeObservedMetric(data, context) {
    const {networkRecords} = data;
    const pageStartTime = getPageStartTime(networkRecords);
    const tagEndTime = getTagEndTime(networkRecords);
    const timing = tagEndTime - pageStartTime;
    return Promise.resolve({timing});
  }

}

TagLoadTime = makeComputedArtifact(TagLoadTime);


module.exports = TagLoadTime;

