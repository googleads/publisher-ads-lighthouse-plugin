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
const LanternMetric = require('lighthouse/lighthouse-core/computed/metrics/lantern-metric');
// @ts-ignore
const makeComputedArtifact = require('lighthouse/lighthouse-core/computed/computed-artifact');
const {getPageStartTime, getTagEndTime} = require('../utils/network-timing');
const {isImplTag} = require('../utils/resource-classification');
const {URL} = require('url');

// @ts-ignore
// eslint-disable-next-line max-len
/** @typedef {import('lighthouse/lighthouse-core/lib/dependency-graph/base-node.js').Node} Node */

/** Computes simulated tag load time using Lantern. */
class LanternTagLoadTime extends LanternMetric {
  /**
   * @return {LH.Gatherer.Simulation.MetricCoefficients}
   * @override
   */
  static get COEFFICIENTS() {
    return {
      intercept: 0,
      optimistic: 0.5,
      pessimistic: 0.5,
    };
  }

  /**
   * @param {Node} root Root of the dependency graph, i.e. the
   *     document node.
   * @return {Node} A subgraph from root to the first ad request.
   * @override
   */
  static getPessimisticGraph(root) {
    return LanternTagLoadTime.getOptimisticGraph(root);
  }

  /**
   * @param {Node} root Root of the dependency graph, i.e. the
   *     document node.
   * @return {Node} A subgraph from root to the first ad request.
   * @override
   */
  static getOptimisticGraph(root) {
    const isTagNode = /** @param {Node} node @return boolean */ (node) =>
      node.record && node.record.url && isImplTag(new URL(node.record.url));
    return root.cloneWithRelationships(isTagNode);
  }
}

// Decorate the class.
// @ts-ignore Allow reassignment for decoration.
// eslint-disable-next-line no-class-assign
LanternTagLoadTime = makeComputedArtifact(LanternTagLoadTime);

/** Computes the tag load time metric. */
class TagLoadTime extends ComputedMetric {
  /**
   * @param {LH.Artifacts.MetricComputationData} data
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Artifacts.Metric>}
   * @override
   */
  static computeSimulatedMetric(data, context) {
    return LanternTagLoadTime.request(data, context);
  }

  /**
   * @param {LH.Artifacts.MetricComputationData} data
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Artifacts.Metric>}
   * @override
   */
  static async computeObservedMetric(data, context) {
    const {networkRecords} = data;
    const pageStartTime = getPageStartTime(networkRecords);
    const tagEndTime = getTagEndTime(networkRecords);
    const timing = tagEndTime - pageStartTime;
    return Promise.resolve({timing});
  }
}

// Decorate the class.
// @ts-ignore Allow reassignment for decoration.
// eslint-disable-next-line no-class-assign
TagLoadTime = makeComputedArtifact(TagLoadTime);

module.exports = TagLoadTime;

