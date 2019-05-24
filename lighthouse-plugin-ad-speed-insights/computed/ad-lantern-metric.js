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
const LanternMetric = require('lighthouse/lighthouse-core/computed/metrics/lantern-metric');
const {getHeaderBidder, isGoogleAds} = require('../utils/resource-classification');

class AdLanternMetric extends LanternMetric {
  /**
   * @return {LH.Gatherer.Simulation.MetricCoefficients}
   * @override
   */
  static get COEFFICIENTS() {
    return {
      intercept: 0,
      optimistic: 0.7,
      pessimistic: 0.3,
    };
  }

  /**
   * @param {Node} root Root of the dependency graph, i.e. the
   *     document node.
   * @return {Node}
   * @override
   */
  static getPessimisticGraph(graph) {
    return graph;  // Return the whole graph
  }

  /**
   * @param {Node} root Root of the dependency graph, i.e. the
   *     document node.
   * @return {Node}
   * @override
   */
  static getOptimisticGraph(graph) {
    // Only include resources in the following categories:
    //   - render blocking
    //   - ads/analytics related.
    return graph.cloneWithRelationships((node) => {
      if (!node.record) {
        return false;
      }
      if (node.hasRenderBlockingPriority()) {
        return true;
      }
      const url = node.record.url;
      return getHeaderBidder(url) || isGoogleAds(new URL(url))
    });
  }

  /**
   * @param {LH.Gatherer.Simulation.Result} simulationResult
   * @param {Object} extras
   * @return {LH.Gatherer.Simulation.Result}
   * @override
   */
  static getEstimateFromSimulation(simulationResult, extras) {
    throw new Error('Not implemented');
  }

  /**
   * @param {Map<LH.Gatherer.Simulation.GraphNode,
   *             LH.Gatherer.Simulation.NodeTiming>} nodeTimings
   * @param {(LH.Artifacts.NetworkRequest) => boolean} isTargetRequest
   * @return {number}
   */
  static findNetworkTiming(nodeTimings, isTargetRequest) {
    let leastStartTime = Infinity;
    for (const [{record}, timing] of nodeTimings.entries()) {
      if (!record || !isTargetRequest(record)) continue;
      if (leastStartTime < timing.startTime) continue;
      leastStartTime = timing.startTime;
    }
    return leastStartTime;
 }
}

module.exports = AdLanternMetric;
