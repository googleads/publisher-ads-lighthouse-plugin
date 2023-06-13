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

import AdLanternMetric from '../computed/ad-lantern-metric.js';

import {BaseNode} from 'lighthouse/core/lib/dependency-graph/base-node.js';
import {getAttributableUrl} from '../utils/tasks.js';
import {LoadSimulator} from 'lighthouse/core/computed/load-simulator.js';
import {MainThreadTasks} from 'lighthouse/core/computed/main-thread-tasks.js';
import {makeComputedArtifact} from 'lighthouse/core/computed/computed-artifact.js';
import {NetworkRecords} from 'lighthouse/core/computed/network-records.js';
import {PageDependencyGraph} from 'lighthouse/core/computed/page-dependency-graph.js';

// eslint-disable-next-line max-len
/** @typedef {import('lighthouse/core/lib/dependency-graph/base-node.js').Node} Node */

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
// eslint-disable-next-line require-jsdoc
class LongTasks {
  /**
   * @param {LH.Trace} trace
   * @param {LH.DevtoolsLog} devtoolsLog
   * @param {LH.Artifacts.URL} URL
   * @param {LH.Audit.Context} context
   * @return {Promise<Node>}
   */
  static async getSimulationGraph(trace, devtoolsLog, URL, context) {
    const documentNode =
      await PageDependencyGraph.request({trace, devtoolsLog, URL}, context);
    return AdLanternMetric.getOptimisticGraph(documentNode);
  }

  /**
   * @param {LH.Trace} trace
   * @param {LH.DevtoolsLog} devtoolsLog
   * @param {LH.Artifacts.URL} URL
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Artifacts.TaskNode[]>}
   */
  static async computeSimulatedResult(trace, devtoolsLog, URL, context) {
    const graph =
      await this.getSimulationGraph(trace, devtoolsLog, URL, context);
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
        // @ts-expect-error TODO Nodes do not have this information though?
        parent: node.parent,
        // @ts-expect-error TODO Nodes do not have this information though?
        unbounded: node.unbounded,
        // @ts-expect-error TODO Nodes do not have this information though?
        group: node.group,
        endEvent: undefined,
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
   * @param {{devtoolsLog: LH.DevtoolsLog,
   * trace: LH.Trace, URL: LH.Artifacts.URL}} data
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Artifacts.TaskNode[]>}
   */
  static async compute_({trace, devtoolsLog, URL}, context) {
    return context.settings.throttlingMethod == 'simulate' ?
      this.computeSimulatedResult(trace, devtoolsLog, URL, context) :
      this.computeObservedResult(trace, devtoolsLog, context);
  }
}

// Decorate the class.
const ComputedLongTasks = makeComputedArtifact(LongTasks,
  ['devtoolsLog', 'trace', 'URL']);

export default ComputedLongTasks;
