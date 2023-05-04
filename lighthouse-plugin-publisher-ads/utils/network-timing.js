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

import AdLanternMetric from '../computed/ad-lantern-metric.js';

// @ts-ignore
import {LoadSimulator} from 'lighthouse/core/computed/load-simulator.js';

import {NetworkRecords} from 'lighthouse/core/computed/network-records.js';
import {PageDependencyGraph} from 'lighthouse/core/computed/page-dependency-graph.js';
import {isAdRequest, isBidRequest, isImplTag, isImpressionPing} from './resource-classification.js';

/** @typedef {LH.Artifacts.NetworkRequest} NetworkRequest */
/** @typedef {LH.Gatherer.Simulation.NodeTiming} NodeTiming */

/* eslint-disable max-len */
/** @typedef {import('lighthouse/core/lib/dependency-graph/network-node.js').NetworkNode} NetworkNode */
/* eslint-enable max-len */

/**
 * Returns end time of tag load (s) relative to system boot.
 * @param {LH.Artifacts.NetworkRequest[]} networkRecords
 * @return {number}
 */
function getTagEndTime(networkRecords) {
  const tagRecord = networkRecords.find(
    (record) => isImplTag(new URL(record.url)));
  return tagRecord ? tagRecord.networkEndTime : -1;
}

/**
 * Returns start time of first ad request (s) relative to system boot.
 * @param {LH.Artifacts.NetworkRequest[]} networkRecords
 * @return {number}
 */
function getAdStartTime(networkRecords) {
  const firstAdRecord = networkRecords.find(isAdRequest);
  return firstAdRecord ? firstAdRecord.networkRequestTime : -1;
}

/**
 * Returns start time of first bid request (s) relative to system boot.
 * @param {LH.Artifacts.NetworkRequest[]} networkRecords
 * @return {number}
 */
function getBidStartTime(networkRecords) {
  const firstBidRecord = networkRecords.find(isBidRequest);
  return firstBidRecord ? firstBidRecord.networkRequestTime : -1;
}

/**
 * Returns start time of first ad impression relative to system boot.
 * @param {LH.Artifacts.NetworkRequest[]} networkRecords
 * @return {number}
 */
function getImpressionStartTime(networkRecords) {
  const firstImpressionRecord = networkRecords.find(
    (record) => isImpressionPing(record.url));
  return firstImpressionRecord ? firstImpressionRecord.networkRequestTime : -1;
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
  return firstSuccessRecord ? firstSuccessRecord.networkRequestTime : defaultValue;
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
    firstSuccessRecord.responseHeadersEndTime : defaultValue;
}

/**
 * @param {LH.Trace} trace
 * @param {LH.DevtoolsLog} devtoolsLog
 * @param {LH.Artifacts.URL} URL
 * @param {LH.Audit.Context} context
 * @return {Promise<Map<NetworkRequest, NodeTiming>>}
 */
async function getTimingsByRecord(trace, devtoolsLog, URL, context) {
  /** @type {Map<NetworkRequest, NodeTiming>} */
  const timingsByRecord = new Map();
  const networkRecords = await NetworkRecords.request(devtoolsLog, context);
  if (context.settings.throttlingMethod == 'simulate') {
    const documentNode =
      await PageDependencyGraph.request({trace, devtoolsLog, URL}, context);
    const releventGraph = AdLanternMetric.getOptimisticGraph(documentNode);
    const simulator = await LoadSimulator.request(
      {devtoolsLog, settings: context.settings}, context);
    const {nodeTimings} = simulator.simulate(releventGraph, {});
    for (const [node, timing] of nodeTimings.entries()) {
      if (node.type !== 'network') continue;
      timingsByRecord.set(node.record, timing);
    }
  } else {
    const pageStartTime = getPageStartTime(networkRecords);
    for (const record of networkRecords) {
      timingsByRecord.set(record, {
        startTime: (record.networkRequestTime - pageStartTime) * 1000,
        endTime: (record.networkEndTime - pageStartTime) * 1000,
        duration: (record.networkEndTime - record.networkRequestTime) * 1000,
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
 * @param {LH.Artifacts.URL} URL
 * @param {LH.Audit.Context} context
 * @return {Promise<Map<string, number>>} A map from script URL to evaluation
 *   time.
 */
async function getScriptEvaluationTimes(trace, devtoolsLog, URL, context) {
  const networkRecords = await NetworkRecords.request(devtoolsLog, context);
  const pageStartTime = getPageStartTime(networkRecords) * 1000;
  /** @type {Map<string, number>} */
  const rawTimes = new Map();
  for (const e of trace.traceEvents) {
    const script = getScriptUrl(e);
    if (!script) {
      continue;
    }
    const time = (e.ts / 1000) - pageStartTime;
    // @ts-ignore The get() call won't return undefined.
    if (!rawTimes.has(script) || rawTimes.get(script) > time) {
      rawTimes.set(script, time);
    }
  }
  if (context.settings.throttlingMethod !== 'simulate') {
    return rawTimes;
  }
  // Offset each timing by network timings to account for simulation.
  const timingsByRecord = await getTimingsByRecord(trace, devtoolsLog, URL, context);
  /** @type {Map<string, number>} */
  const simulatedTimes = new Map();
  for (const [req, timing] of timingsByRecord.entries()) {
    const scriptEvalTime = rawTimes.get(req.url);
    if (!scriptEvalTime) {
      continue;
    }
    if (simulatedTimes.has(req.url)) {
      continue;
    }
    const unsimulatedNetworkTime = req.networkRequestTime * 1000 - pageStartTime;
    const simulatedNetworkTime = timing.endTime;

    const cpuFactor = context.settings.throttling.cpuSlowdownMultiplier;
    // Any time between script eval and network response is due to cpu.
    const unsimulatedCpuTime = scriptEvalTime - unsimulatedNetworkTime;
    const simulatedCpuTime = cpuFactor * unsimulatedCpuTime;
    // Update results.
    simulatedTimes.set(req.url, simulatedNetworkTime + simulatedCpuTime);
  }
  return simulatedTimes;
}

export {
  getTagEndTime,
  getImpressionStartTime,
  getAdStartTime,
  getBidStartTime,
  getPageStartTime,
  getPageResponseTime,
  getScriptUrl,
  getTimingsByRecord,
  getScriptEvaluationTimes,
};
