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

const i18n = require('lighthouse/lighthouse-core/lib/i18n/i18n');
const MainThreadTasks = require('lighthouse/lighthouse-core/computed/main-thread-tasks');
const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records');
// @ts-ignore
const TraceOfTab = require('lighthouse/lighthouse-core/computed/trace-of-tab');
const {auditNotApplicable} = require('../messages/common-strings');
const {Audit} = require('lighthouse');
const {getAdCriticalGraph} = require('../utils/graph');
const {getAttributableUrl} = require('../utils/tasks');
const {getTimingsByRecord} = require('../utils/network-timing');

const UIStrings = {
  title: 'Ads not blocked by load events',
  failureTitle: 'Avoid load event handlers in critical path of ad requests',
  description: 'TODO',
  displayValue: '{timeInMs, number, seconds} s blocked',
  columnEvent: 'Event',
  columnTime: 'Time',
  columnUrl: 'Script',
  columnFunctionName: 'Function',
  columnLineNumber: 'Line',
  columnColumnNumber: 'Column',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

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
  {key: 'eventName', itemType: 'text', text: str_(UIStrings.columnEvent)},
  {key: 'time', itemType: 'ms', text: str_(UIStrings.columnTime)},
  {key: 'url', itemType: 'url', text: str_(UIStrings.columnUrl)},
  {key: 'functionName', itemType: 'text', text: str_(UIStrings.columnFunctionName)},
  {key: 'lineNumber', itemType: 'numeric', text: str_(UIStrings.columnLineNumber)},
  {key: 'columnNumber', itemType: 'numeric', text: str_(UIStrings.columnColumnNumber)},
];

function findOriginalCallFrame(request) {
  let stack = request.initiator && request.initiator.stack;
  if (!stack) {
    return undefined;
  }
  while (stack.parent) {
    stack = stack.parent
  }
  return stack.callFrames[stack.callFrames.length - 1];
}

function findTraceEventOfCallFrame(callFrame, traceEvents) {
  return traceEvents.find((e) => {
    return e.name == 'FunctionCall'
      && e.args.data &&
      e.args.data.functionName == callFrame.functionName &&
      e.args.data.scriptId == callFrame.scriptId &&
      e.args.data.url == callFrame.url &&
      // Tolerate off by one errors in line/column numbers.
      Math.abs(e.args.data.lineNumber == callFrame.lineNumber) < 2 &&
      Math.abs(e.args.data.columnNumber == callFrame.columnNumber) < 2;
  });
}

function findEventIntervals(eventName, traceEvents) {
  let openInterval = {};
  const intervals = [];
  for (const e of traceEvents) {
    if (e.name == `${eventName}EventStart`) {
      openInterval = {start: e.ts, eventName};
    } else if (e.name == `${eventName}EventEnd`) {
      openInterval.end = e.ts;
      intervals.push(openInterval);
    }
  }
  return intervals;
}

function quantifyBlockedTime(blockingEvent, timings, networkRecords,
    timingsByRecord) {
  const eventScript = networkRecords.find(
    (r) => r.url == blockingEvent.url);
  const scriptLoadTime = timingsByRecord.get(eventScript);
  const blockedRequest = networkRecords.find(
    (r) => r.url == blockingEvent.blockedUrl);
  const blockedRequestLoadTime = timingsByRecord.get(blockedRequest);
  if (!scriptLoadTime || !blockedRequestLoadTime) {
    return 0;
  }
  const eventListenerScript = networkRecords.find(
    (r) => r.url == blockingEvent.url);
  const eventTime = timings[blockingEvent.eventName];
  return eventTime - scriptLoadTime.endTime;
}


/**
 * Audit to find blocking load events.
 */
class BlockingLoadEvents extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id: 'blocking-load-events',
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
    const {processEvents} = await TraceOfTab.request(trace, context);

    const timerEvents =
        trace.traceEvents.filter((t) => t.name.startsWith('Timer'));

    const criticalRequests =
      getAdCriticalGraph(networkRecords, trace.traceEvents);


    const eventTimes = [
      ...findEventIntervals('domContentLoaded', processEvents),
      ...findEventIntervals('load', processEvents),
    ];
    const {ts: navigationStart} =
      processEvents.find((e) => e.name === 'navigationStart');
    const blockingEvents = [];
    const seen = new Set();
    for (const r of criticalRequests) {
      const callFrame = findOriginalCallFrame(r);
      if (!callFrame) {
        // Skip. This is expected of resources that weren't initiated by
        // scripts.
        continue;
      }
      const json = JSON.stringify(callFrame);
      if (seen.has(json)) {
        // Skip call frames that we already checked.
        continue;
      }
      seen.add(json);
      const traceEvent = findTraceEventOfCallFrame(callFrame, processEvents);
      if (!traceEvent) {
        continue;
      }
      const interval = eventTimes.find((interval) =>
        interval.start <= traceEvent.ts && traceEvent.ts <= interval.end);
      if (interval) {
        blockingEvents.push(Object.assign({
          eventName: interval.eventName,
          blockedUrl: r.url,
        }, callFrame));
      }
    }

    const failed = blockingEvents.length > 0;
    let blockedTime = 0;
    if (failed) {
      const {timings} = await TraceOfTab.request(trace, context);
      /** @type {Map<NetworkRequest, NodeTiming>} */
      const timingsByRecord =
        await getTimingsByRecord(trace, devtoolsLog, context);
      blockedTime = quantifyBlockedTime(
        blockingEvents[0], timings, networkRecords, timingsByRecord);
    }
    return {
      numericValue: blockingEvents.length,
      score: failed ? 0 : 1,
      displayValue: failed  && blockedTime?
        str_(UIStrings.displayValue, {timeInMs: blockedTime}) :
        '',
      details: BlockingLoadEvents.makeTableDetails(HEADINGS, blockingEvents),
    };
  }
}

module.exports = BlockingLoadEvents;
module.exports.UIStrings = UIStrings;
