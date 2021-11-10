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

const AdLanternMetric = require('../computed/ad-lantern-metric');
const BaseNode = require('lighthouse/lighthouse-core/lib/dependency-graph/base-node.js');
// @ts-ignore
const ComputedMetric = require('lighthouse/lighthouse-core/computed/metrics/metric.js');
// eslint-disable-next-line no-unused-vars
const CpuNode = require('lighthouse/lighthouse-core/lib/dependency-graph/cpu-node.js');
const {getAttributableUrl} = require('../utils/tasks');
// @ts-ignore
const LoadSimulator = require('lighthouse/lighthouse-core/computed/load-simulator.js');
const MainThreadTasks = require('lighthouse/lighthouse-core/computed/main-thread-tasks.js');
// @ts-ignore
const makeComputedArtifact = require('lighthouse/lighthouse-core/computed/computed-artifact.js');
// eslint-disable-next-line no-unused-vars
const NetworkNode = require('lighthouse/lighthouse-core/lib/dependency-graph/network-node.js');
const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records.js');
const PageDependencyGraph = require('lighthouse/lighthouse-core/computed/page-dependency-graph.js');

const PROVIDED_LONG_TASK_THRESHOLD_MS = 50;
const SIMULATED_LONG_TASK_THRESHOLD_MS = 100;

/**
 * @param {LH.Artifacts.TaskNode} task
 * @param {Set<string>} knownScripts
 * @return {boolean}
 */
function isLong(task, knownScripts) {
  if (task.duration < PROVIDED_LONG_TASK_THRESHOLD_MS) {
    return false; // Short task
  }
  const script = getAttributableUrl(task, knownScripts);
  if (!script) {
    return false;
  }
  if (task.parent) {
    // Only show this long task if doing so adds more information for debugging.
    // So we hide it if it's attributed to the same script as the parent task.
    const parentScript = getAttributableUrl(task.parent, knownScripts);
    return script != parentScript;
  }
  return true;
}

/** Finds long tasks, with support for simulation. */
class LongTasks extends ComputedMetric {
  /**
   * @param {LH.Trace} trace
   * @param {LH.DevtoolsLog} devtoolsLog
   * @param {LH.Audit.Context} context
   * @return {Promise<BaseNode>} networkRecords
   */
  static async getSimulationGraph(trace, devtoolsLog, context) {
    /** @type {NetworkNode} */
    const documentNode =
      // @ts-ignore Property 'request' does not appear on PageDependencyGraph
      await PageDependencyGraph.request({trace, devtoolsLog}, context);
    return AdLanternMetric.getOptimisticGraph(documentNode);
  }

  /**
   * @param {LH.Trace} trace
   * @param {LH.DevtoolsLog} devtoolsLog
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Artifacts.TaskNode[]>} networkRecords
   */
  static async computeSimulatedResult(trace, devtoolsLog, context) {
    const graph = await this.getSimulationGraph(trace, devtoolsLog, context);
    const simulator = await LoadSimulator.request(
      {devtoolsLog, settings: context.settings}, context);
    const {nodeTimings} = simulator.simulate(graph, {});

    /** @type {LH.Artifacts.TaskNode[]} */ const tasks = [];
    for (const [node, timing] of nodeTimings.entries()) {
      if (node.type !== BaseNode.TYPES.CPU ||
          timing.duration < SIMULATED_LONG_TASK_THRESHOLD_MS) {
        continue; // Not a long task
      }
      tasks.push({
        event: node.event,
        startTime: timing.startTime,
        endTime: timing.endTime,
        duration: timing.duration,
        selfTime: timing.duration, // TODO: subtract child time
        attributableURLs: Array.from(node.getEvaluateScriptURLs()),
        children: [],
        parent: node.parent,
        unbounded: node.unbounded,
        group: node.group,
      });
    }
    return tasks;
  }

  /**
   * @param {LH.Trace} trace
   * @param {LH.DevtoolsLog} devtoolsLog
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Artifacts.TaskNode[]>}
   */
  static async computeObservedResult(trace, devtoolsLog, context) {
    const tasks = await MainThreadTasks.request(trace, context);
    const networkRecords = await NetworkRecords.request(devtoolsLog, context);

    /** @type {Set<string>} */ const knownScripts = new Set(networkRecords
        .filter((record) => record.resourceType === 'Script')
        .map((record) => record.url));
    return tasks.filter((t) => isLong(t, knownScripts));
  }

  /**
   * @param {{devtoolsLog: LH.DevtoolsLog, trace: LH.Trace}} data
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Artifacts.TaskNode[]>}
   */
  static async compute_({trace, devtoolsLog}, context) {
    return context.settings.throttlingMethod == 'simulate' ?
      this.computeSimulatedResult(trace, devtoolsLog, context) :
      this.computeObservedResult(trace, devtoolsLog, context);
  }

  /**
   * @param {unknown} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Artifacts.TaskNode[]>}
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
LongTasks = makeComputedArtifact(LongTasks);

module.exports = LongTasks;
