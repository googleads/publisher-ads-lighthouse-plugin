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
const {isBidRequest, isGoogleAds, isGptAdRequest} = require('../utils/resource-classification');

/**
 * Returns the frame ID of the given event, if present.
 * @param {LH.TraceEvent} event
 * @return {?string}
 */
function getFrame(event) {
  // @ts-ignore
  return event.args.frame || event.args.data && event.args.data.frame || null;
}

function getCpuNodeUrls(cpuNode) {
  /** @type {Set<string>} */ const results = new Set();
  for (const {args} of cpuNode.childEvents) {
    if (args.data && args.data.url) {
      results.add(args.data.url);
    }
  }
  return Array.from(results);
}

function linkBidAndAdRequests(graph) {
  const adRequestNodes = [];
  graph.traverse((node) => {
    if (node.record && isGptAdRequest(node.record)) {
      adRequestNodes.push(node);
    }
  });
  graph.traverse((node) => {
    if (node.record && isBidRequest(node.record)) {
      for (const adNode of adRequestNodes) {
        // TODO(warrengm): Check for false positives. We don't worry too much
        // since we're focussing on the first few requests.
        if (adNode.record.startTime >= node.record.endTime) {
          node.addDependent(adNode);
        }
      }
    }
  });
}

/** An abstract class for ad lantern metrics. */
class AdLanternMetric extends LanternMetric {
  /**
   * @return {LH.Gatherer.Simulation.MetricCoefficients}
   * @override
   */
  static get COEFFICIENTS() {
    return {
      intercept: 0,
      optimistic: 1,
      pessimistic: 0,
    };
  }

  /**
   * @param {Node} root Root of the dependency graph, i.e. the
   *     document node.
   * @return {Node}
   * @override
   */
  static getPessimisticGraph(graph) {
    // The pessimistic graph is the whole graph.
    const pessimisticGraph = graph.cloneWithRelationships((n) => true);
    linkBidAndAdRequests(pessimisticGraph);
    return pessimisticGraph;
  }

  /**
   * @param {Node} root Root of the dependency graph, i.e. the
   *     document node.
   * @return {Node}
   * @override
   */
  static getOptimisticGraph(graph) {
    const mainFrame = graph.record.frameId;
    const pessimisticGraph = AdLanternMetric.getPessimisticGraph(graph);
    // Filter the pessimistic graph.
    const optimisticGraph = pessimisticGraph.cloneWithRelationships((node) => {
      if (!node.record) {
        return getCpuNodeUrls(node).includes(isBidRequest);
      }
      if (node.hasRenderBlockingPriority()) {
        return true;
      }
      const url = node.record.url;
      return isBidRequest(url) || isGoogleAds(new URL(url));
    });
    return optimisticGraph;
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

  /**
   * @param {Map<LH.Gatherer.Simulation.GraphNode,
   *             LH.Gatherer.Simulation.NodeTiming>} nodeTimings
   * @param {(LH.Artifacts.NetworkRequest) => boolean} isTargetNode
   * @return {LH.Gatherer.Simulation.NodeTiming}
   */
  static findNetworkTiming(nodeTimings, isTargetRequest) {
    return this.findTiming(
      nodeTimings,
      (node) => node.record && isTargetRequest(node.record));
  }
}

module.exports = AdLanternMetric;
