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

// eslint-disable-next-line max-len
/** @typedef {import('lighthouse/core/lib/dependency-graph/base-node.js').Node} Node */

import {BaseNode} from 'lighthouse/core/lib/dependency-graph/base-node.js';
// eslint-disable-next-line no-unused-vars
import {CPUNode} from 'lighthouse/core/lib/dependency-graph/cpu-node.js';
// eslint-disable-next-line max-len
import {LanternMetric} from 'lighthouse/core/computed/metrics/lantern-metric.js';
// eslint-disable-next-line max-len, no-unused-vars
import {NetworkNode} from 'lighthouse/core/lib/dependency-graph/network-node.js';

import {
  isBidRelatedRequest,
  isImpressionPing,
  isGoogleAds,
  isGptAdRequest,
  isGptTag,
  isGptImplTag,
  toURL,
} from '../utils/resource-classification.js';

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
 * @param {CPUNode} cpuNode
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
 * Checks if the given CPU node is related to bidding.
 * @param {CPUNode} cpuNode
 * @return {boolean}
 */
function isAdTask(cpuNode) {
  return !!getCpuNodeUrls(cpuNode).find(
    (url) => isBidRelatedRequest(url) || isGoogleAds(toURL(url)));
}

/**
 * Checks if the given CPU node is a long task.
 * @param {CPUNode} cpuNode
 * @return {boolean}
 */
function isLongTask(cpuNode) {
  // TODO(warrengm): Consider scaling 50 ms based on current processor speed
  // so that we include tasks that will be long on slower processors.
  return cpuNode.event.dur > 50 * 1000;
}

/**
 * Adds a dependency edge between a nd b, where a came before b.
 * @param {CPUNode|NetworkNode} a
 * @param {CPUNode|NetworkNode} b
 */
function addEdge(a, b) {
  if (a === b || a.endTime > b.startTime) return;
  a.addDependent(b);
}

/**
 * Inserts edges between bid requests and ad requests.
 * @param {Node} graph
 */
function addEdges(graph) {
  /** @type {NetworkNode[]} */ const adRequestNodes = [];
  /** @type {NetworkNode[]} */ const gptJsNodes = [];
  graph.traverse((node) => {
    if (node.type !== BaseNode.TYPES.NETWORK) {
      return;
    }
    if (isGptTag(node.record.url) && node.record.resourceType === 'Script') {
      gptJsNodes.push(node);
    } else if (isGptAdRequest(node.record)) {
      adRequestNodes.push(node);
    }
  });
  graph.traverse((node) => {
    if (node.type !== BaseNode.TYPES.NETWORK) {
      return;
    }
    if (isGptImplTag(node.record.url)) {
      const gptImplNode = node;
      for (const gptJsNode of gptJsNodes) {
        addEdge(gptJsNode, gptImplNode);
      }
    }
    if (isBidRelatedRequest(node.record)) {
      const bidNode = node;
      for (const adNode of adRequestNodes) {
        addEdge(bidNode, adNode);
      }
    }
    if (isImpressionPing(node.record.url)) {
      const impressionNode = node;
      for (const adNode of adRequestNodes) {
        addEdge(adNode, impressionNode);
        for (const dependent of adNode.getDependents()) {
          addEdge(dependent, impressionNode);
        }
      }
    }
  });
}

/** An abstract class for ad lantern metrics. */
class AdLanternMetric extends LanternMetric {
  /**
   * @return {LH.Gatherer.Simulation.MetricCoefficients}
   */
  static get COEFFICIENTS() {
    return {
      intercept: 0,
      // We only have one graph so put all the weight on it.
      optimistic: 1,
      pessimistic: 0,
    };
  }

  /**
   * @param {Node} graph Root of the dependency graph, i.e. the
   *     document node.
   * @return {Node}
   */
  static getPessimisticGraph(graph) {
    // The pessimistic graph is the whole graph.
    const pessimisticGraph = graph.cloneWithRelationships((_) => true);
    addEdges(pessimisticGraph);
    return pessimisticGraph;
  }

  /**
   * @param {Node} graph Root of the dependency graph, i.e. the
   *     document node.
   * @return {Node}
   */
  static getOptimisticGraph(graph) {
    // @ts-ignore
    const mainFrame = graph.record.frameId;
    const pessimisticGraph = AdLanternMetric.getPessimisticGraph(graph);
    // Filter the pessimistic graph.
    const optimisticGraph = pessimisticGraph.cloneWithRelationships((node) => {
      if (node.type === BaseNode.TYPES.CPU) {
        return (
          isLongTask(node) ||
          isAdTask(node) ||
          !!getFrame(node.event) && getFrame(node.event) !== mainFrame);
      }
      if (node.hasRenderBlockingPriority()) {
        return true;
      }
      const /** string */ url = node.record.url;
      return isBidRelatedRequest(url) || isGoogleAds(toURL(url));
    });
    addEdges(pessimisticGraph);
    return optimisticGraph;
  }

  /**
   * @param {LH.Gatherer.Simulation.Result} simulationResult
   * @param {Object} extras
   * @return {LH.Gatherer.Simulation.Result}
   */
  static getEstimateFromSimulation(simulationResult, extras) {
    throw new Error(
      'getEstimateFromSimulation not implemented by ' + this.name);
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
      (node) => node.type === BaseNode.TYPES.NETWORK &&
        isTargetRequest(node.record));
  }
}

export default AdLanternMetric;
