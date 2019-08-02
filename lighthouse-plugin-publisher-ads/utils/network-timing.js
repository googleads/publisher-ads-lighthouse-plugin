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

const AdLanternMetric = require('../computed/ad-lantern-metric');
// @ts-ignore
const LoadSimulator = require('lighthouse/lighthouse-core/computed/load-simulator');
const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records');
const PageDependencyGraph = require('lighthouse/lighthouse-core/computed/page-dependency-graph');
const {isGptAdRequest, isImplTag} = require('./resource-classification');
const {URL} = require('url');

/** @typedef {LH.Artifacts.NetworkRequest} NetworkRequest */
/** @typedef {LH.Gatherer.Simulation.NodeTiming} NodeTiming */

/* eslint-disable max-len */
/** @typedef {import('lighthouse/lighthouse-core/lib/dependency-graph/base-node.js').Node} Node */
/** @typedef {import('lighthouse/lighthouse-core/lib/dependency-graph/network-node.js')} NetworkNode */
/* eslint-enable max-len */

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
 * @param {LH.Audit.Context} context
 * @return {Promise<Map<NetworkRequest, NodeTiming>>}
 */
async function getTimingsByRecord(trace, devtoolsLog, context) {
  /** @type {Map<NetworkRequest, NodeTiming>} */
  const timingsByRecord = new Map();
  const networkRecords = await NetworkRecords.request(devtoolsLog, context);
  if (context.settings.throttlingMethod == 'simulate') {
    /** @type {NetworkNode} */
    const documentNode =
      // @ts-ignore Property 'request' does not appear on PageDependencyGraph
      await PageDependencyGraph.request({trace, devtoolsLog}, context);
    const releventGraph = AdLanternMetric.getOptimisticGraph(documentNode);
    const simulator = await LoadSimulator.request(
      {devtoolsLog, settings: context.settings}, context);
    const {nodeTimings} = simulator.simulate(releventGraph, {});
    for (const [{record}, timing] of nodeTimings.entries()) {
      if (!record) continue;
      timingsByRecord.set(record, timing);
    }
  } else {
    const pageStartTime = getPageStartTime(networkRecords);
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

/**
 * @param {LH.TraceEvent} e A trace event.
 * @return {string|undefined} A script URL, if applicable.
 */
function getScriptUrl(e) {
  if (!e.args.data) {
    return undefined;
  }
  if (!['EvaluateScript', 'FunctionCall'].includes(e.name)) {
    return undefined;
  }
  if (e.args.data.url) {
    return e.args.data.url;
  }
  if (e.args.data.stackTrace) {
    return e.args.data.stackTrace[0].url;
  }
  return undefined;
}

/**
 * Returns the load time for each script based on when the script executed. This
 * is particularly important when network timing does not reflect execution
 * time (for example if the script was preloaded).
 * @param {LH.Trace} trace
 * @param {LH.DevtoolsLog} devtoolsLog
 * @param {LH.Audit.Context} context
 * @return {Promise<Map<string, number>>} A map from script URL to evaluation
 *   time.
 */
async function getScriptEvaluationTimes(trace, devtoolsLog, context) {
  const networkRecords = await NetworkRecords.request(devtoolsLog, context);
  const pageStartTime = getPageStartTime(networkRecords) * 1000;
  /** @type {Map<string, number>} */
  const results = new Map();
  for (const e of trace.traceEvents) {
    const script = getScriptUrl(e);
    if (script && !results.has(script)) {
      results.set(script, (e.ts / 1000) - pageStartTime);
    }
  }
  if (context.settings.throttlingMethod !== 'simulate') {
    return results;
  }
  // Offset each timing by network timings to account for simulation.
  const timingsByRecord = await getTimingsByRecord(trace, devtoolsLog, context);
  for (const [req, timing] of timingsByRecord.entries()) {
    const scriptEvalTime = results.get(req.url);
    if (!scriptEvalTime) {
      continue;
    }
    const unsimulatedNetworkTime = req.startTime * 1000 - pageStartTime;
    const simulatedNetworkTime = timing.endTime;

    const cpuFactor = context.settings.throttling.cpuSlowdownMultiplier;
    // Any time between script eval and network response is due to cpu.
    const unsimulatedCpuTime = scriptEvalTime - unsimulatedNetworkTime;
    const simulatedCpuTime = cpuFactor * unsimulatedCpuTime;
    // Update results.
    results.set(req.url, simulatedNetworkTime + simulatedCpuTime);
  }
  return results;
}

module.exports = {
  getTagEndTime,
  getAdStartTime,
  getPageStartTime,
  getPageResponseTime,
  getTimingsByRecord,
  getScriptEvaluationTimes,
};
