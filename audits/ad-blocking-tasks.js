const {isGoogleAds} = require('../utils/resource-classification');
const {Audit} = require('lighthouse');
const {URL} = require('url');

/**
 * Threshold for long task duration (ms), from http://go/w3c-github/longtasks.
 */
const LONG_TASK_DUR_MS = 50;

/**
 * Table headings for audits details sections.
 * @type {LH.Audit.Heading[]}
 */
const HEADINGS = [
  {key: 'name', itemType: 'text', text: 'Name'},
  {key: 'group', itemType: 'text', text: 'Category'},
  {key: 'duration', itemType: 'ms', text: 'Duration'},
  {key: 'adReqBlocked', itemType: 'url', text: 'Ad Request Blocked'},
];

/**
 * @param {LH.Artifacts.TaskNode} task
 * @return {boolean}
 */
function isLong(task) {
  return task.duration >= LONG_TASK_DUR_MS &&
      task.children.every((/** @type {LH.Artifacts.TaskNode} */ child) =>
        child.duration < LONG_TASK_DUR_MS);
}

/**
 * Compute the offset between the devtools network records timeline and the
 * main thread tasks timeline computed by LH from the traces.
 *
 * @param {LH.Trace} trace
 * @param {LH.Artifacts.TaskNode[]} tasks
 * @param {LH.WebInspector.NetworkRequest[]} networkRecords
 * @return {number} offset (ms)
 */
function computeNetworkTimelineOffset(trace, tasks, networkRecords) {
  if (!networkRecords.length) throw new Error('No network records to compare');
  if (!tasks.length) throw new Error('No tasks to compare');

  // Select reference points in both timelines
  const network = networkRecords[0];
  const task = tasks[0];

  // Find trace event for network reference
  const event = trace.traceEvents.find((e) =>
    e.name == 'ResourceSendRequest' && !!e.args.data &&
      e.args.data.requestId == network.requestId);

  // Compute equivalent task time (µs) from event (ms)
  if (!event) throw new Error('No event matches network records');
  const taskTime = (event.ts - task.event.ts) / 1000 + task.startTime;

  // Compute offset (ms) between network and task time
  return taskTime - 1000 * network.startTime;
}

/** @inheritDoc */
class AdBlockingTasks extends Audit {
  /**
   * @return {AuditMetadata}
   * @override
   */
  static get meta() {
    return {
      id: 'ad-blocking-tasks',
      title: 'No long tasks seem to block ad-related network requests',
      failureTitle: 'Long tasks are blocking ad-related network requests',
      description: 'Tasks blocking the main thread can delay the ad related ' +
          'resources, consider removing long blocking tasks or moving them ' +
          'off the main thread with web workers.',
      requiredArtifacts: ['traces', 'Network'],
    };
  }

  /**
   * @param {Artifacts} artifacts
   * @return {Promise<LH.Audit.Product>}
   * @override
   */
  static async audit(artifacts) {
    const {networkRecords} = artifacts.Network;
    const trace = artifacts.traces[AdBlockingTasks.DEFAULT_PASS];
    const tasks = await artifacts.requestMainThreadTasks(trace);

    const offset = computeNetworkTimelineOffset(trace, tasks, networkRecords);
    const fixTime = (/** @type {number} */ networkTime) =>
      networkTime * 1000 + offset;

    const longTasks = tasks.filter(isLong);
    const adNetworkReqs = networkRecords.filter((req) =>
      isGoogleAds(new URL(req.url)));

    // Pre-sort tasks and requests for performance.
    adNetworkReqs.sort((l, r) => l.startTime - r.startTime);

    /** @type {{[x: string]: LH.Audit.DetailsItem}[]} */
    const blocking = [];

    let longTaskIndex = 0;
    for (const adNetworkReq of adNetworkReqs) {
      for (; longTaskIndex < longTasks.length; longTaskIndex++) {
        const longTask = longTasks[longTaskIndex];

        // Handle cases without any overlap.
        if (longTask.endTime < fixTime(adNetworkReq.startTime)) continue;
        if (fixTime(adNetworkReq.endTime) < longTask.startTime) break;

        // Check if longTask delayed NetworkRecord.
        if (fixTime(adNetworkReq._responseReceivedTime) < longTask.endTime) {
          blocking.push({
            name: longTask.event.name || '',
            group: longTask.group.label,
            duration: longTask.duration,
            adReqBlocked: adNetworkReq.url,
          });
        }
      }
    }

    return {
      rawValue: blocking.length == 0,
      displayValue: blocking.length ? `${blocking.length} long task(s)` : '',
      details: AdBlockingTasks.makeTableDetails(HEADINGS, blocking),
    };
  }
}

module.exports = AdBlockingTasks;
