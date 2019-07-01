//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const AdRequestTime = require('../computed/ad-request-time');
const LongTasks = require('../computed/long-tasks');
const {auditNotApplicable} = require('../utils/builder');
const {AUDITS, NOT_APPLICABLE} = require('../messages/messages');
const {Audit} = require('lighthouse');
const {formatMessage} = require('../messages/format');
const {getAttributableUrl} = require('../utils/tasks');
const {isGpt} = require('../utils/resource-classification');
const {URL} = require('url');

const id = 'ad-blocking-tasks';
const {
  title,
  failureTitle,
  description,
  displayValue,
  failureDisplayValue,
  headings,
} = AUDITS[id];

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
  {key: 'script', itemType: 'url', text: headings.script},
  {key: 'startTime', itemType: 'ms', text: headings.startTime, granularity: 1},
  {key: 'endTime', itemType: 'ms', text: headings.endTime, granularity: 1},
  {key: 'duration', itemType: 'ms', text: headings.duration, granularity: 1},
];

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
      return auditNotApplicable(NOT_APPLICABLE.INVALID_TIMING);
    }

    if (!longTasks.length) {
      return auditNotApplicable(NOT_APPLICABLE.NO_TASKS);
    }

    const {timing: endTime} =
        await AdRequestTime.request(metricData, context);

    if (!(endTime > 0)) { // Handle NaN, etc.
      return auditNotApplicable(NOT_APPLICABLE.NO_AD_RELATED_REQ);
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
        formatMessage(failureDisplayValue, {numTasks}) :
        displayValue,
      details: AdBlockingTasks.makeTableDetails(HEADINGS, blocking),
    };
  }
}

module.exports = AdBlockingTasks;
