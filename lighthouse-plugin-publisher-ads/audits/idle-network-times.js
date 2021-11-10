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

const i18n = require('lighthouse/lighthouse-core/lib/i18n/i18n.js');
const MainThreadTasks = require('lighthouse/lighthouse-core/computed/main-thread-tasks.js');
const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records.js');
// @ts-ignore
const TraceOfTab = require('lighthouse/lighthouse-core/computed/trace-of-tab.js');
const {auditNotApplicable} = require('../messages/common-strings');
const {Audit} = require('lighthouse');
const {computeAdRequestWaterfall} = require('../utils/graph');
const {getAttributableUrl} = require('../utils/tasks');
const {getPageStartTime} = require('../utils/network-timing');

const UIStrings = {
  title: '[Experimental] Network is efficiently utilized before ad requests',
  failureTitle: '[Experimental] Reduce network idle time before ad requests',
  description: 'Moments of network idleness in the critical path to ad ' +
  'loading present opportunities to improve speed. Consider eliminating long ' +
  'tasks, timeouts, waiting on load events, or synchronous resources to avoid ' +
  'idleness. Chrome DevTools can be used to discover what is causing network ' +
  'idleness. [Learn more](' +
  'https://developers.google.com/web/tools/chrome-devtools/evaluate-performance/reference' +
  ').',
  displayValue: '{timeInMs, number, seconds} s spent idle in critical path',
  columnCause: 'Suspected Cause',
  columnUrl: 'Attributable URL',
  columnStartTime: 'Start',
  columnDuration: 'Duration',
  causeDomContentLoaded: 'DOMContentLoaded Event',
  causeLoadEvent: 'Load Event',
  causeLongTask: 'Long Task',
  causeRenderBlockingResource: 'Blocking Resource',
  causeTimeout: 'Timeout',
  causeOther: 'Other',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

/** @enum {string} */
const Cause = {
  DOM_CONTENT_LOADED: str_(UIStrings.causeDomContentLoaded),
  LOAD_EVENT: str_(UIStrings.causeLoadEvent),
  LONG_TASK: str_(UIStrings.causeLongTask),
  RENDER_BLOCKING_RESOURCE: str_(UIStrings.causeRenderBlockingResource),
  TIMEOUT: str_(UIStrings.causeTimeout),
  OTHER: str_(UIStrings.causeOther),
};

/**
 * @typedef {Object} IdlePeriod
 * @property {number} startTime
 * @property {number} endTime
 * @property {number} duration
 * @property {string} url The attributable url
 * @property {string} cause
 */

/**
 * Table headings for audits details sections.
 * @type {LH.Audit.Details.Table['headings']}
 */
const HEADINGS = [
  {
    key: 'cause',
    itemType: 'text',
    text: str_(UIStrings.columnCause),
  },
  {
    key: 'url',
    itemType: 'url',
    text: str_(UIStrings.columnUrl),
  },
  {
    key: 'startTime',
    itemType: 'ms',
    text: str_(UIStrings.columnStartTime),
    granularity: 1,
  },
  {
    key: 'duration',
    itemType: 'ms',
    text: str_(UIStrings.columnDuration),
    granularity: 1,
  },
];

// TODO(warrengm) tune parameters below.

/**
 * Any contiguous idle times that exceed the following threshold will be
 * included in the report.
 */
const MINIMUM_NOTEWORTHY_IDLE_GAP_MS = 150;

/**
 * This audit will fail if there is a contiguous idle time that exceeds this
 * threshold.
 */
const FAILING_IDLE_GAP_MS = 400;

/** This audit will fail if the total idle time exceeds this threshold. */
const FAILING_TOTAL_IDLE_TIME_MS = 1500;

/**
 * Returns the intersection of a and b.
 * @param {{startTime: number, endTime: number}} a
 * @param {{startTime: number, endTime: number}} b
 * @return {number}
 */
function getOverlapTime(a, b) {
  return Math.min(a.endTime, b.endTime) - Math.max(a.startTime, b.startTime);
}

const OVERLAP_THRESHOLD = 0.80;
const PROXIMITY_MS_THRESHOLD = 50;

/**
 * Checks if any task causes the idle period and attributes it if so.
 * @param {IdlePeriod} idlePeriod
 * @param {LH.Artifacts.TaskNode[]} mainThreadTasks
 * @param {LH.TraceEvent[]} timerEvents
 * @return {boolean} True if the task caused the idle period, false otherwise.
 */
function checkIfTaskIsBlocking(idlePeriod, mainThreadTasks, timerEvents) {
  // Check if long task is blocking.
  for (const task of mainThreadTasks) {
    const overlapTime = getOverlapTime(task, idlePeriod);
    if (task.duration > 100 &&
        overlapTime / idlePeriod.duration > OVERLAP_THRESHOLD) {
      idlePeriod.cause = Cause.LONG_TASK;
      idlePeriod.url = getAttributableUrl(task);
      return true;
    }
    // Check if timer is blocking.
    if (task.event.name == 'TimerFire' &&
        idlePeriod.endTime - task.startTime < PROXIMITY_MS_THRESHOLD) {
      const timerId =
        task.event.args.data && task.event.args.data.timerId || '';
      const start = timerEvents.find((t) =>
        // @ts-ignore
        t.name == 'TimerInstall' && t.args.data.timerId == timerId);
      // @ts-ignore
      const timeout = start.args.data.timeout;
      if (timeout / idlePeriod.duration > OVERLAP_THRESHOLD) {
        idlePeriod.cause = Cause.TIMEOUT + ` (${timeout} ms)`;
        // @ts-ignore
        idlePeriod.url = start.args.data.stackTrace[0].url;
        return true;
      }
    }
    if (task.startTime > idlePeriod.endTime) {
      // Done searching tasks.
      break;
    }
  }
  return false;
}

/**
 * Checks if any tag is blocking and therefore causing the idle period in ad
 * loading.
 * @param {IdlePeriod} idlePeriod
 * @param {LH.Artifacts.TagBlockingFirstPaint[]} blockingTags
 * @param {number} pageStartTime
 * @return {boolean} True if the tag caused the idle period, false otherwise.
 */
function checkIfTagIsBlocking(idlePeriod, blockingTags, pageStartTime) {
  for (const tag of blockingTags) {
    const shifted = {
      startTime: (tag.startTime - pageStartTime) * 1000,
      endTime: (tag.endTime - pageStartTime) * 1000,
    };
    const overlap = getOverlapTime(shifted, idlePeriod);
    if (overlap / idlePeriod.duration > OVERLAP_THRESHOLD) {
      idlePeriod.cause = Cause.RENDER_BLOCKING_RESOURCE;
      // Yes, tag.tag is correct.
      idlePeriod.url = tag.tag.url;
      return true;
    }
  }
  return false;
}
/**
 * Checks waiting on load events is the cause of the idle period.
 * @param {IdlePeriod} idlePeriod
 * @param {LH.Artifacts.NavigationTraceTimes} timings
 * @return {boolean} True if waiting on load is the suspected cause, false
 *     otherwise.
 */
function checkIfLoadIsBlocking(idlePeriod, timings) {
  if (timings.domContentLoaded &&
      idlePeriod.endTime > timings.domContentLoaded &&
      idlePeriod.endTime - timings.domContentLoaded < PROXIMITY_MS_THRESHOLD) {
    // TODO(warrengm): Attribute this to the script that installed the load
    // event listener.
    idlePeriod.cause = Cause.DOM_CONTENT_LOADED;
    return true;
  }
  if (timings.load && idlePeriod.endTime > timings.load &&
      idlePeriod.endTime - timings.load < PROXIMITY_MS_THRESHOLD) {
    // TODO(warrengm): Attribute this to the script that installed the load
    // event listener.
    idlePeriod.cause = Cause.LOAD_EVENT;
    return true;
  }
  return false;
}

/**
 * Checks the cause of the idle period.
 * @param {IdlePeriod} idlePeriod
 * @param {LH.Artifacts.TaskNode[]} mainThreadTasks
 * @param {LH.TraceEvent[]} timerEvents
 * @param {LH.Artifacts.NavigationTraceTimes} timings
 * @param {LH.Artifacts.TagBlockingFirstPaint[]} blockingTags
 * @param {number} pageStartTime
 */
function determineCause(
  idlePeriod, mainThreadTasks, timerEvents, timings, blockingTags,
  pageStartTime) {
  checkIfTaskIsBlocking(idlePeriod, mainThreadTasks, timerEvents) ||
      checkIfTagIsBlocking(idlePeriod, blockingTags, pageStartTime) ||
      checkIfLoadIsBlocking(idlePeriod, timings);
}

/**
 * Audit to check the length of the critical path to load ads.
 * Also determines the critical path for visualization purposes.
 */
class IdleNetworkTimes extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id: 'idle-network-times',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      requiredArtifacts: ['devtoolsLogs', 'traces', 'TagsBlockingFirstPaint'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts, context) {
    const trace = artifacts.traces[Audit.DEFAULT_PASS];
    const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const networkRecords = await NetworkRecords.request(devtoolsLog, context);
    /** @type {LH.Artifacts.TaskNode[]} */ let mainThreadTasks = [];
    try {
      mainThreadTasks = await MainThreadTasks.request(trace, context);
    } catch (e) {
      // Ignore tracing errors.
    }
    const {timings} = await TraceOfTab.request(trace, context);

    const timerEvents =
        trace.traceEvents.filter((t) => t.name.startsWith('Timer'));

    const pageStartTime = getPageStartTime(networkRecords);
    const blockingRequests =
      await computeAdRequestWaterfall(trace, devtoolsLog, context);
    if (!blockingRequests.length) {
      return auditNotApplicable.NoAdRelatedReq;
    }

    let maxEndSoFar = Infinity;
    const idleTimes = [];
    for (let i = 0; i < blockingRequests.length;) {
      const {startTime, endTime} = blockingRequests[i];
      if (startTime - maxEndSoFar > MINIMUM_NOTEWORTHY_IDLE_GAP_MS) {
        const idlePeriod = {
          startTime: maxEndSoFar,
          endTime: startTime,
          duration: startTime - maxEndSoFar,
          cause: Cause.OTHER,
          url: '',
        };
        determineCause(
          idlePeriod, mainThreadTasks, timerEvents, timings,
          artifacts.TagsBlockingFirstPaint, pageStartTime);
        idleTimes.push(idlePeriod);
      }

      maxEndSoFar = endTime;
      while (++i < blockingRequests.length &&
          blockingRequests[i].startTime < maxEndSoFar) {
        maxEndSoFar = Math.max(maxEndSoFar, blockingRequests[i].endTime);
      }
    }

    const durations = idleTimes.map((it) => it.duration);
    const totalIdleTime = durations.reduce((sum, dur) => sum + dur, 0);
    const maxIdleTime = Math.max(...durations);
    const failed = maxIdleTime > FAILING_IDLE_GAP_MS ||
      totalIdleTime > FAILING_TOTAL_IDLE_TIME_MS;

    return {
      numericValue: maxIdleTime,
      numericUnit: 'millisecond',
      score: failed ? 0 : 1,
      displayValue:
        str_(UIStrings.displayValue, {timeInMs: (totalIdleTime)}),
      details: IdleNetworkTimes.makeTableDetails(HEADINGS, idleTimes),
    };
  }
}

module.exports = IdleNetworkTimes;
module.exports.UIStrings = UIStrings;
