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

const BaseNode = require('lighthouse/lighthouse-core/lib/dependency-graph/base-node.js');
const CpuNode = require('lighthouse/lighthouse-core/lib/dependency-graph/cpu-node.js');
// @ts-ignore Remove request() below after importing the type.
const LanternMetric = require('lighthouse/lighthouse-core/computed/metrics/lantern-metric');
const NetworkNode = require('lighthouse/lighthouse-core/lib/dependency-graph/network-node.js');
const {isBidRequest, isGoogleAds, isGptAdRequest} = require('../utils/resource-classification');
const {URL} = require('url');

/** @typedef {LH.Gatherer.Simulation.GraphNode} GraphNode */
/** @typedef {LH.Gatherer.Simulation.NodeTiming} NodeTiming */

/**
 * Returns the frame ID of the given event, if present.
 * @param {LH.TraceEvent} event
 * @return {?string}
 */
function getFrame(event) {
  // @ts-ignore
  return event.args.frame || event.args.data && event.args.data.frame || null;
}

/**
 * Returns a list of URLs associated with this CPU node.
 * @param {CpuNode} cpuNode
 * @return {string[]}
 */
function getCpuNodeUrls(cpuNode) {
  /** @type {Set<string>} */ const results = new Set();
  for (const {args} of cpuNode.childEvents) {
    if (args.data && args.data.url) {
      results.add(args.data.url);
    }
  }
  return Array.from(results);
}

/**
 * Inserts edges between bid requests and ad requests.
 * @param {BaseNode} graph
 */
function linkBidAndAdRequests(graph) {
  /** @type {NetworkNode[]} */ const adRequestNodes = [];
  graph.traverse((node) => {
    if (node instanceof NetworkNode && isGptAdRequest(node.record)) {
      adRequestNodes.push(node);
    }
  });
  graph.traverse((node) => {
    if (node instanceof NetworkNode && isBidRequest(node.record)) {
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
   * @param {BaseNode} graph Root of the dependency graph, i.e. the
   *     document node.
   * @return {BaseNode}
   * @override
   */
  static getPessimisticGraph(graph) {
    // The pessimistic graph is the whole graph.
    const pessimisticGraph = graph.cloneWithRelationships(_ => true);
    linkBidAndAdRequests(pessimisticGraph);
    return pessimisticGraph;
  }

  /**
   * @param {BaseNode} graph Root of the dependency graph, i.e. the
   *     document node.
   * @return {BaseNode}
   * @override
   */
  static getOptimisticGraph(graph) {
    // @ts-ignore
    const mainFrame = graph.record.frameId;
    const pessimisticGraph = AdLanternMetric.getPessimisticGraph(graph);
    // Filter the pessimistic graph.
    const optimisticGraph = pessimisticGraph.cloneWithRelationships((node) => {
      if (node instanceof CpuNode) {
        return !!getCpuNodeUrls(node).find(isBidRequest) ||
          !!getFrame(node.event) && getFrame(node.event) !== mainFrame;
      }
      if (node.hasRenderBlockingPriority()) {
        return true;
      }
      const /** string */ url = node.record.url;
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
   * @param {Map<GraphNode, NodeTiming>} nodeTimings
   * @param {function(GraphNode, NodeTiming): boolean} isTargetNode
   * @return {NodeTiming}
   */
  static findTiming(nodeTimings, isTargetNode) {
    let leastTiming = {startTime: Infinity, endTime: -Infinity, duration: 0};
    for (const [node, timing] of nodeTimings.entries()) {
      if (isTargetNode(node, timing) &&
          leastTiming.startTime > timing.startTime) {
        leastTiming = timing;
      }
    }
    return leastTiming;
  }

  /**
   * @param {Map<GraphNode, NodeTiming>} nodeTimings
   * @param {function(LH.Artifacts.NetworkRequest): boolean} isTargetRequest
   * @return {NodeTiming}
   */
  static findNetworkTiming(nodeTimings, isTargetRequest) {
    return this.findTiming(
      nodeTimings,
      (node) => node instanceof NetworkNode && isTargetRequest(node.record));
  }
}

module.exports = AdLanternMetric;
