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

/**
 * Returns the frame ID of the given event, if present.
 * @param {LH.TraceEvent} event
 * @return {?string}
 */
function getFrame(event) {
  // @ts-ignore
  return event.args.frame || event.args.data && event.args.data.frame || null;
}

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
    const mainFrame = graph.record.frameId;
    // Only include resources in the following categories:
    //   - render blocking
    //   - ads/analytics related.
    return graph.cloneWithRelationships((node) => {
      if (!node.record) {
        // TODO(warrengm): Check URLs of CPU nodes.
        return getFrame(node.event) && getFrame(node.event) !== mainFrame;
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
   * @param {(LH.Gatherer.Simulation.GraphNode) => boolean} isTargetNode
   * @return {LH.Gatherer.Simulation.NodeTiming}
   */
  static findTiming(nodeTimings, isTargetNode) {
    let leastTiming = {startTime: Infinity, endTime: -Infinity};
    for (const [node, timing] of nodeTimings.entries()) {
      if (isTargetNode(node, timing) &&
          leastTiming.startTime > timing.startTime) {
        leastTiming = timing;
      }
    }
    return leastTiming;
  }

  static findNetworkTiming(nodeTimings, isTargetRequest) {
    return this.findTiming(
        nodeTimings,
        (node) => node.record && isTargetRequest(node.record));
  }
}

module.exports = AdLanternMetric;
