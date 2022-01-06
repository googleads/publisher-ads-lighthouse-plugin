//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const AdRequestTime = require('../computed/ad-request-time');
const i18n = require('lighthouse/lighthouse-core/lib/i18n/i18n.js');
const LongTasks = require('../computed/long-tasks');
const {auditNotApplicable} = require('../messages/common-strings');
const {Audit} = require('lighthouse');
const {getAttributableUrl} = require('../utils/tasks');
const {isAdScript} = require('../utils/resource-classification');

const UIStrings = {
  /* Title of the audit */
  title: 'No long tasks blocking ad-related network requests',
  failureTitle: 'Avoid long tasks that block ad-related network requests',
  description: 'Tasks blocking the main thread can delay ad requests and cause ' +
  'a poor user experience. Consider removing long blocking tasks or moving ' +
  'them off of the main thread. These tasks can be especially detrimental to ' +
  'performance on less powerful devices. [Learn more](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/ad-blocking-tasks' +
  ').',
  failureDisplayValue: '{timeInMs, number, seconds} s blocked',
  columnScript: 'Attributable URL',
  columnStartTime: 'Start',
  columnDuration: 'Duration',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);
/**
 * @typedef {Object} TaskDetails
 * @property {number} startTime
 * @property {number} endTime
 * @property {number} duration
 * @property {string} script
 * @property {string} rawUrl
 * @property {boolean} isTopLevel
 */

/**
 * Table headings for audits details sections.
 * @type {LH.Audit.Details.Table['headings']}
 */
const HEADINGS = [
  {
    key: 'script',
    itemType: 'url',
    text: str_(UIStrings.columnScript),
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

/** @inheritDoc */
class AdBlockingTasks extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id: 'ad-blocking-tasks',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      requiredArtifacts: ['traces', 'devtoolsLogs'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   * @override
   */
  static async audit(artifacts, context) {
  /**
   * Threshold to show long tasks in the report. We don't show shorter long
   * tasks since they each have a smaller impact on blocking ads.
   */
    const LONG_TASK_DUR_MS =
      context.settings.throttlingMethod == 'simulate' ? 200 : 100;
    const trace = artifacts.traces[Audit.DEFAULT_PASS];
    const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const metricData = {trace, devtoolsLog, settings: context.settings};
    let longTasks = [];
    try {
      longTasks = await LongTasks.request(metricData, context);
    } catch (e) {
      return auditNotApplicable.InvalidTiming;
    }

    if (!longTasks.length) {
      return auditNotApplicable.NoTasks;
    }

    const {timing: endTime} =
        await AdRequestTime.request(metricData, context);

    if (!(endTime > 0)) { // Handle NaN, etc.
      return auditNotApplicable.NoAdRelatedReq;
    }

    /** @type {TaskDetails[]} */ const blocking = [];
    for (const longTask of longTasks) {
      if (longTask.startTime > endTime ||
          longTask.duration < LONG_TASK_DUR_MS) {
        continue;
      }
      const scriptUrl = getAttributableUrl(longTask);
      if (scriptUrl && isAdScript(new URL(scriptUrl))) {
        continue;
      }

      const url = scriptUrl && new URL(scriptUrl);
      const displayUrl = url && (url.origin + url.pathname) || 'Other';

      blocking.push({
        // TODO(warrengm): Format the display URL so it fits on one line
        script: displayUrl,
        rawUrl: scriptUrl,
        startTime: longTask.startTime,
        endTime: longTask.endTime,
        duration: longTask.duration,
        isTopLevel: !longTask.parent,
      });
    }

    let filteredBlocking = Array.from(blocking);
    const taskLimit = 10;
    if (filteredBlocking.length > taskLimit) {
      // For the sake of brevity, we show at most 10 long tasks. If needed we
      // will filter tasks that are less actionable (child tasks or ones missing
      // attributable URLs).
      filteredBlocking = blocking
          .filter((b) => b.script !== 'Other' && b.isTopLevel)
      // Only show the longest tasks.
          .sort((a, b) => b.duration - a.duration)
          .splice(0, taskLimit)
          .sort((a, b) => a.startTime - b.startTime);
    }

    const blockedTime = filteredBlocking.reduce(
      (sum, t) => t.isTopLevel ? sum + t.duration : sum, 0);
    const failed = filteredBlocking.length > 0;
    return {
      score: failed ? 0 : 1,
      numericValue: blockedTime,
      numericUnit: 'millisecond',
      displayValue: failed ?
        str_(UIStrings.failureDisplayValue, {timeInMs: blockedTime}) :
        '',
      details: AdBlockingTasks.makeTableDetails(HEADINGS, filteredBlocking),
    };
  }
}

module.exports = AdBlockingTasks;
module.exports.UIStrings = UIStrings;
