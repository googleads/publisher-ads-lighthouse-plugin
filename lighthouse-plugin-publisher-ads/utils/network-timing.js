// Copyright 2018 Google LLC
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

const CpuNode = require('lighthouse/lighthouse-core/lib/dependency-graph/cpu-node.js');
// @ts-ignore
const LoadSimulator = require('lighthouse/lighthouse-core/computed/load-simulator');
// @ts-ignore
const PageDependencyGraph = require('lighthouse/lighthouse-core/computed/page-dependency-graph');
const NetworkNode = require('lighthouse/lighthouse-core/lib/dependency-graph/network-node.js');
const {isGptAdRequest, isImplTag} = require('./resource-classification');
const {URL} = require('url');

/** @typedef {LH.Artifacts.NetworkRequest} NetworkRequest */
/** @typedef {LH.Gatherer.Simulation.NodeTiming} NodeTiming */

/**
 * Returns end time of tag load (s) relative to system boot.
 * @param {LH.Artifacts.NetworkRequest[]} networkRecords
 * @return {number}
 */
function getTagEndTime(networkRecords) {
  const tagRecord = networkRecords.find(
    (record) => isImplTag(new URL(record.url)));
  return tagRecord ? tagRecord.endTime : -1;
}

/**
 * Returns start time of first ad request (s) relative to system boot.
 * @param {LH.Artifacts.NetworkRequest[]} networkRecords
 * @return {number}
 */
function getAdStartTime(networkRecords) {
  const firstAdRecord = networkRecords.find(
    (record) => isGptAdRequest(record));
  return firstAdRecord ? firstAdRecord.startTime : -1;
}

/**
 * Returns start time of page request (s) relative to system boot.
 * @param {LH.Artifacts.NetworkRequest[]} networkRecords
 * @param {number=} defaultValue
 * @return {number}
 */
function getPageStartTime(networkRecords, defaultValue = -1) {
  const firstSuccessRecord = networkRecords.find(
    (record) => record.statusCode == 200);
  return firstSuccessRecord ? firstSuccessRecord.startTime : defaultValue;
}

/**
 * Returns start time of page response (s) relative to system boot.
 * @param {LH.Artifacts.NetworkRequest[]} networkRecords
 * @param {number=} defaultValue
 * @return {number}
 */
function getPageResponseTime(networkRecords, defaultValue = -1) {
  const firstSuccessRecord = networkRecords.find(
    (record) => record.statusCode == 200);
  return firstSuccessRecord ?
    firstSuccessRecord.responseReceivedTime : defaultValue;
}

/**
 * @param {LH.Trace} trace
 * @param {LH.DevtoolsLog} devtoolsLog
 * @param {Set<NetworkRequest>} networkRecords
 * @param {LH.Audit.Context} context
 * @return {Promise<Map<NetworkRequest, NodeTiming>>}
 */
async function getTimingsByRecord(trace, devtoolsLog, networkRecords, context) {
  /** @type {Map<NetworkRequest, NodeTiming>} */
  const timingsByRecord = new Map();

  if (context.settings.throttlingMethod == 'simulate') {
    /** @type {NetworkNode} */
    const documentNode =
      // @ts-ignore Property 'request' does not appear on PageDependencyGraph
      await PageDependencyGraph.request({trace, devtoolsLog}, context);
    const releventGraph = documentNode.cloneWithRelationships(
      (node) => {
        if (node instanceof CpuNode) return false;
        return node.hasRenderBlockingPriority() ||
            networkRecords.has(node.record);
      });
    const simulator = await LoadSimulator.request(
      {devtoolsLog, settings: context.settings}, context);
    const {nodeTimings} = simulator.simulate(releventGraph, {});
    for (const [{record}, timing] of nodeTimings.entries()) {
      if (!record) continue;
      timingsByRecord.set(record, timing);
    }
  } else {
    const pageStartTime = getPageStartTime(Array.from(networkRecords));
    for (const record of networkRecords) {
      timingsByRecord.set(record, {
        startTime: (record.startTime - pageStartTime) * 1000,
        endTime: (record.endTime - pageStartTime) * 1000,
        duration: (record.endTime - record.startTime) * 1000,
      });
    }
  }
  return timingsByRecord;
}

module.exports = {
  getTagEndTime,
  getAdStartTime,
  getPageStartTime,
  getPageResponseTime,
  getTimingsByRecord,
};
