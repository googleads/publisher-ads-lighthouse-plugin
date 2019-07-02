//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const AdRequestTime = require('../computed/ad-request-time');
const common = require('../messages/common-strings');
const LongTasks = require('../computed/long-tasks');
const {auditNotApplicable} = require('../utils/builder');
const {Audit} = require('lighthouse');
const {getAttributableUrl} = require('../utils/tasks');
const {isGpt} = require('../utils/resource-classification');
const {URL} = require('url');
// @ts-ignore
const i18n = require('lighthouse/lighthouse-core/lib/i18n/i18n.js');

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
  failureDisplayValue: '{numTasks} long {numTasks, plural, =1 {task} other ' +
  '{tasks}}',
  columnScript: 'Attributable URL',
  columnStartTime: 'Start',
  columnEndTime: 'End',
  columnDuration: 'Duration',
};

const str_ = i18n.createMessageInstanceIdFn(__filename,
  Object.assign(UIStrings, common.UIStrings));
/**
 * @typedef {Object} TaskDetails
 * @property {number} startTime
 * @property {number} endTime
 * @property {number} duration
 * @property {string} script
 * @property {boolean} isTopLevel
 */

/**
 * Threshold to show long tasks in the report. We don't show shorter long tasks
 * since they each have a smaller impact on blocking ads.
 */
const LONG_TASK_DUR_MS = 100;

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
    key: 'endTime',
    itemType: 'ms',
    text: str_(UIStrings.columnEndTime),
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
    const trace = artifacts.traces[Audit.DEFAULT_PASS];
    const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const metricData = {trace, devtoolsLog, settings: context.settings};
    let longTasks = [];
    try {
      longTasks = await LongTasks.request(metricData, context);
    } catch (e) {
      return auditNotApplicable(
        str_(common.UIStrings.NOT_APPLICABLE__INVALID_TIMING));
    }

    if (!longTasks.length) {
      return auditNotApplicable(
        str_(common.UIStrings.NOT_APPLICABLE__NO_TASKS));
    }

    const {timing: endTime} =
        await AdRequestTime.request(metricData, context);

    if (!(endTime > 0)) { // Handle NaN, etc.
      return auditNotApplicable(
        str_(common.UIStrings.NOT_APPLICABLE__NO_AD_RELATED_REQ));
    }

    /** @type {TaskDetails[]} */ let blocking = [];
    for (const longTask of longTasks) {
      if (longTask.startTime > endTime ||
          longTask.duration < LONG_TASK_DUR_MS) {
        continue;
      }
      const scriptUrl = getAttributableUrl(longTask);
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

    const numTasks = blocking.length;
    return {
      score: Number(blocking.length == 0),
      displayValue: blocking.length ?
        str_(UIStrings.failureDisplayValue, {numTasks}) :
        '',
      details: AdBlockingTasks.makeTableDetails(HEADINGS, blocking),
    };
  }
}

module.exports = AdBlockingTasks;
module.exports.UIStrings = UIStrings;
