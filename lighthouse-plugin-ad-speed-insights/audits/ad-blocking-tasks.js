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

const MainThreadTasks = require('lighthouse/lighthouse-core/computed/main-thread-tasks');
const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records');
const util = require('util');
const {auditNotApplicable} = require('../utils/builder');
const {AUDITS, NOT_APPLICABLE} = require('../messages/messages.js');
const {Audit} = require('lighthouse');
const {getAttributableUrl} = require('../utils/tasks');
const {isGoogleAds, isGpt} = require('../utils/resource-classification');
const {URL} = require('url');

const id = 'ad-blocking-tasks';
const {
  title,
  failureTitle,
  description,
  displayValue,
  failureDisplayValue,
} = AUDITS[id];

/**
 * Threshold for long task duration (ms), from https://github.com/w3c/longtasks.
 */
const LONG_TASK_DUR_MS = 100;

/**
 * Table headings for audits details sections.
 * @type {LH.Audit.Details.Table['headings']}
 */
const HEADINGS = [
  {key: 'script', itemType: 'url', text: 'Attributable URL'},
  {key: 'startTime', itemType: 'ms', text: 'Start', granularity: 1},
  {key: 'endTime', itemType: 'ms', text: 'End', granularity: 1},
  {key: 'duration', itemType: 'ms', text: 'Duration', granularity: 1},
];

/**
 * @param {LH.Artifacts.TaskNode} task
 * @param {Set<string>} knownScripts
 * @return {boolean}
 */
function isLong(task, knownScripts) {
  if (task.duration < LONG_TASK_DUR_MS) {
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

/**
 * Compute the offset between the devtools network records timeline and the
 * main thread tasks timeline computed by LH from the traces.
 *
 * @param {LH.Trace} trace
 * @param {LH.Artifacts.TaskNode[]} tasks
 * @param {LH.Artifacts.NetworkRequest[]} networkRecords
 * @return {number|null} offset (ms) or null if error
 */
function computeNetworkTimelineOffset(trace, tasks, networkRecords) {
  // Select reference points in both timelines
  const network = networkRecords[0];
  const task = tasks[0];

  // Find trace event for network reference
  const event = trace.traceEvents.find((e) =>
    e.name == 'ResourceSendRequest' && !!e.args.data &&
      e.args.data.requestId == network.requestId);

  // Checks for case where no events match network records
  if (!event) return null;

  // Compute equivalent task time (µs) from event (ms)
  const taskTime = (event.ts - task.event.ts) / 1000 + task.startTime;

  // Compute offset (ms) between network and task time
  return taskTime - 1000 * network.startTime;
}


/** @inheritDoc */
class AdBlockingTasks extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id,
      title,
      failureTitle,
      description,
      requiredArtifacts: ['traces'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   * @override
   */
  static async audit(artifacts, context) {
    const trace = artifacts.traces[AdBlockingTasks.DEFAULT_PASS];
    const devtoolsLogs = artifacts.devtoolsLogs[AdBlockingTasks.DEFAULT_PASS];
    const networkRecords = await NetworkRecords.request(devtoolsLogs, context);
    let tasks = [];
    try {
      tasks = await MainThreadTasks.request(trace, context);
    } catch (e) {
      return auditNotApplicable(NOT_APPLICABLE.INVALID_TIMING);
    }

    if (!networkRecords.length) {
      return auditNotApplicable(NOT_APPLICABLE.NO_RECORDS);
    }
    if (!tasks.length) {
      return auditNotApplicable(NOT_APPLICABLE.NO_TASKS);
    }

    const offset = computeNetworkTimelineOffset(trace, tasks, networkRecords);
    if (offset == null) {
      return auditNotApplicable(NOT_APPLICABLE.NO_EVENT_MATCHING_REQ);
    }
    const fixTime = (/** @type {number} */ networkTime) =>
      networkTime * 1000 + offset;

    const adNetworkReqs = networkRecords
        .filter((req) => isGoogleAds(new URL(req.url)))
        .filter((req) => req.resourceType == 'XHR');

    if (!adNetworkReqs.length) {
      return auditNotApplicable(NOT_APPLICABLE.NO_AD_RELATED_REQ);
    }

    const /** @type {Set<string>} */ knownScripts = new Set(networkRecords
        .filter((record) => record.resourceType === 'Script')
        .map((record) => record.url));
    const longTasks = tasks.filter((t) => isLong(t, knownScripts));

    // TODO(warrengm): End on ad load rather than ad request end.
    const endTime = fixTime(Math.min(...adNetworkReqs.map((r) => r.endTime)));

    let blocking = [];
    for (const longTask of longTasks) {
      // Handle cases without any overlap.
      if (longTask.startTime > endTime) {
        continue;
      }
      const scriptUrl = getAttributableUrl(longTask, knownScripts);
      if (scriptUrl && isGpt(new URL(scriptUrl))) {
        continue;
      }

      const url = scriptUrl && new URL(scriptUrl);
      const displayUrl = url && (url.origin + url.pathname);

      blocking.push({
        // TODO(warrengm): Format the display URL so it fits on one line
        script: displayUrl,
        startTime: longTask.startTime,
        endTime: longTask.endTime,
        duration: longTask.duration,
        isTopLevel: !longTask.parent,
      });
    }

    const taskLimit = 10;
    if (blocking.length > taskLimit) {
      // For the sake of brevity, we show at most 5 long tasks. If needed we
      // will filter tasks that are less actionable (child tasks or ones missing
      // attributable URLs).
      blocking = blocking.filter((b) => b.script && b.isTopLevel)
          // Only show the longest tasks.
          .sort((a, b) => b.duration - a.duration)
          .splice(0, taskLimit)
          .sort((a, b) => a.startTime - b.startTime);
    }

    const pluralEnding = blocking.length == 1 ? '' : 's';

    return {
      rawValue: blocking.length == 0,
      displayValue: blocking.length ?
        util.format(failureDisplayValue, blocking.length, pluralEnding) :
        displayValue,
      details: AdBlockingTasks.makeTableDetails(HEADINGS, blocking),
    };
  }
}

module.exports = AdBlockingTasks;
