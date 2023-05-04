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

import * as i18n from 'lighthouse/core/lib/i18n/i18n.js';
import {NetworkRecords} from 'lighthouse/core/computed/network-records.js';
import {ProcessedTrace} from 'lighthouse/core/computed/processed-trace.js';
import {ProcessedNavigation} from 'lighthouse/core/computed/processed-navigation.js';

import {auditNotApplicable} from '../messages/common-strings.js';
import {Audit} from 'lighthouse';
import {computeAdRequestWaterfall} from '../utils/graph.js';
import {getTimingsByRecord} from '../utils/network-timing.js';

/** @typedef {LH.Artifacts.NetworkRequest} NetworkRequest */
/** @typedef {LH.Gatherer.Simulation.NodeTiming} NodeTiming */

const UIStrings = {
  title: 'Ads not blocked by load events',
  failureTitle: 'Avoid waiting on load events',
  description: 'Waiting on load events increases ad latency. ' +
    'To speed up ads, eliminate the following load event handlers. ' +
    '[Learn More](' +
    'https://developers.google.com/publisher-ads-audits/reference/audits/blocking-load-events' +
    ').',
  displayValue: '{timeInMs, number, seconds} s blocked',
  columnEvent: 'Event Name',
  columnTime: 'Event Time',
  columnScript: 'Script',
  columnBlockedUrl: 'Blocked URL',
  columnFunctionName: 'Function',
};

const str_ = i18n.createIcuMessageFn(import.meta.url, UIStrings);

/**
 * Table headings for audits details sections.
 * @type {LH.Audit.Details.Table['headings']}
 */
const HEADINGS = [
  {key: 'eventName', valueType: 'text', label: str_(UIStrings.columnEvent)},
  {key: 'time', valueType: 'ms', label: str_(UIStrings.columnTime), granularity: 1},
  {key: 'url', valueType: 'url', label: str_(UIStrings.columnScript)},
  {key: 'functionName', valueType: 'text', label: str_(UIStrings.columnFunctionName)},
];

/** @typedef {import('../utils/graph.js').SimpleRequest} SimpleRequest */

/**
 * @param {SimpleRequest} request
 * @return {LH.Crdp.Runtime.CallFrame|undefined}
 */
function findOriginalCallFrame(request) {
  const {record} = request;
  let stack = record && record.initiator && record.initiator.stack;
  if (!stack) {
    return undefined;
  }
  while (stack.parent) {
    stack = stack.parent;
  }
  return stack.callFrames[stack.callFrames.length - 1];
}

/**
 * @param {LH.Crdp.Runtime.CallFrame} callFrame
 * @param {LH.TraceEvent[]} traceEvents
 */
function findTraceEventOfCallFrame(callFrame, traceEvents) {
  return traceEvents.find((e) => e.name == 'FunctionCall'
      && e.args.data &&
      // @ts-ignore
      e.args.data.functionName == callFrame.functionName &&
      // @ts-ignore
      e.args.data.scriptId == callFrame.scriptId &&
      // @ts-ignore
      e.args.data.url == callFrame.url &&
      // Tolerate off by one errors in line/column numbers.
      // @ts-ignore
      Math.abs(e.args.data.lineNumber == callFrame.lineNumber) < 2 &&
      // @ts-ignore
      Math.abs(e.args.data.columnNumber == callFrame.columnNumber) < 2);
}

/**
 * @typedef {Object} EventInterval
 * @property {number} start
 * @property {number} end
 * @property {string} eventName
 */

/**
 * Returns a list of time intervals corresponding to when each event handler
 * executed.
 * @param {string} eventName
 * @param {LH.TraceEvent[]} traceEvents
 * @return {EventInterval[]}
 */
function findEventIntervals(eventName, traceEvents) {
  /** @type {EventInterval} */ let openInterval = {};
  /** @type {EventInterval[]} */ const intervals = [];
  for (const e of traceEvents) {
    if (e.name == `${eventName}EventStart`) {
      openInterval = {start: e.ts, end: Infinity, eventName};
    } else if (e.name == `${eventName}EventEnd`) {
      openInterval.end = e.ts;
      intervals.push(openInterval);
    }
  }
  return intervals;
}

/**
 * @typedef {Object} BlockingEvent
 * @property {string} eventName
 * @property {string} blockedUrl
 * @property {number} time
 * @property {number} blockedTime
 */

/**
 * @param {BlockingEvent & LH.Crdp.Runtime.CallFrame} blockingEvent
 * @param {NetworkRequest[]} networkRecords
 * @param {Map<NetworkRequest, NodeTiming>} timingsByRecord
 * @return {number}
 */
function quantifyBlockedTime(blockingEvent, networkRecords, timingsByRecord) {
  const eventScript = networkRecords.find(
    (r) => r.url == blockingEvent.url);
  const blockedRequest = networkRecords.find(
    (r) => r.url == blockingEvent.blockedUrl);
  if (!eventScript || !blockedRequest) {
    return 0;
  }
  const scriptLoadTime = timingsByRecord.get(eventScript);
  const blockedRequestLoadTime = timingsByRecord.get(blockedRequest);
  if (!scriptLoadTime || !blockedRequestLoadTime) {
    return 0;
  }
  return blockedRequestLoadTime.startTime - scriptLoadTime.endTime;
}


/**
 * Audit to find blocking load events.
 */
class BlockingLoadEvents extends Audit {
  /**
   * @return {LH.Audit.Meta}
   */
  static get meta() {
    return {
      id: 'blocking-load-events',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      requiredArtifacts: ['devtoolsLogs', 'traces', 'URL'],
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
    const processedTrace = await ProcessedTrace.request(trace, context);
    const {timings} = await ProcessedNavigation
        .request(trace, context);
    const {processEvents} = processedTrace;
    /** @type {Map<NetworkRequest, NodeTiming>} */
    const timingsByRecord =
      await getTimingsByRecord(trace, devtoolsLog, artifacts.URL, context);

    const criticalRequests =
      // eslint-disable-next-line max-len
      (await computeAdRequestWaterfall(trace, devtoolsLog, artifacts.URL, context))
          // Sort by start time so we process the earliest requests first.
          .sort((a, b) => a.startTime - b.startTime);

    if (!criticalRequests.length) {
      return auditNotApplicable.NoAdRelatedReq;
    }

    const eventTimes = [
      ...findEventIntervals('domContentLoaded', processEvents),
      ...findEventIntervals('load', processEvents),
    ];
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
        /** @type {BlockingEvent & LH.Crdp.Runtime.CallFrame} */
        const blockingEvent = Object.assign({
          eventName: interval.eventName,
          blockedUrl: r.url,
          // @ts-expect-error
          time: timings[interval.eventName],
          blockedTime: Infinity,
        }, callFrame);
        blockingEvent.blockedTime = quantifyBlockedTime(
          blockingEvent, networkRecords, timingsByRecord);
        blockingEvents.push(blockingEvent);
      }
    }

    const failed = blockingEvents.length > 0;
    let blockedTime = 0;
    if (failed) {
      blockedTime = Math.min(...blockingEvents.map((e) => e.blockedTime));
    }
    return {
      numericValue: blockingEvents.length,
      numericUnit: 'unitless',
      score: failed ? 0 : 1,
      displayValue: failed && blockedTime ?
        str_(UIStrings.displayValue, {timeInMs: blockedTime}) :
        '',
      // @ts-expect-error
      details: BlockingLoadEvents.makeTableDetails(HEADINGS, blockingEvents),
    };
  }
}

export default BlockingLoadEvents;
export {UIStrings};
