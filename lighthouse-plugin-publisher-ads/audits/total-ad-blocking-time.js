// Copyright 2021 Google LLC
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const i18n = require('lighthouse/lighthouse-core/lib/i18n/i18n.js');
const LongTasks = require('../computed/long-tasks');
const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records.js');
const {auditNotApplicable} = require('../messages/common-strings');
const {Audit} = require('lighthouse');
const {getAttributableUrl} = require('../utils/tasks');
const {isAdRelated, getNameOrTld} = require('../utils/resource-classification');

const UIStrings = {
  /* Title of the audit */
  title: 'Total ad JS blocking time',
  failureTitle: 'Reduce ad JS blocking time',
  description: 'Ad-related scripts are blocking the main thread. ' +
  '[Learn more](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/total-ad-blocking-time' +
  ').',
  failureDisplayValue: '{timeInMs, number, seconds} s blocked',
  columnName: 'Name',
  columnBlockingTime: 'Blocking Time',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);
/**
 * @typedef {Object} TableRow
 * @property {number} blockingTime
 * @property {string} name
 */

/**
 * Table headings for audits details sections.
 * @type {LH.Audit.Details.Table['headings']}
 */
const HEADINGS = [
  {
    key: 'name',
    itemType: 'text',
    text: str_(UIStrings.columnName),
  },
  {
    key: 'blockingTime',
    itemType: 'ms',
    text: str_(UIStrings.columnBlockingTime),
    granularity: 1,
  },
];

/** @inheritDoc */
class TotalAdBlockingTime extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id: 'total-ad-blocking-time',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      requiredArtifacts: ['traces', 'devtoolsLogs'],
    };
  }

  /**
   * @return {{
    *  simulate: LH.Audit.ScoreOptions, provided: LH.Audit.ScoreOptions,
    * }}
    */
  static get defaultOptions() {
    return {
      simulate: {
        p10: 290,
        median: 600,
      },
      provided: {
        p10: 150,
        median: 350,
      },
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   * @override
   */
  static async audit(artifacts, context) {
    const LONG_TASK_DUR_MS = 50;
    const trace = artifacts.traces[Audit.DEFAULT_PASS];
    const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const networkRecords = await NetworkRecords.request(devtoolsLog, context);
    if (!networkRecords.find((r) => isAdRelated(r.url))) {
      return auditNotApplicable.NoAdRelatedReq;
    }
    const metricData = {trace, devtoolsLog, settings: context.settings};
    let longTasks = [];
    try {
      longTasks = await LongTasks.request(metricData, context);
    } catch (e) {
      return auditNotApplicable.InvalidTiming;
    }

    let totalAdJsBlockingTime = 0;
    /** @type {Map<string, number>} */ const adBlockingTimeByParty = new Map();
    for (const longTask of longTasks) {
      const scriptUrl = getAttributableUrl(longTask);
      if (!scriptUrl || !isAdRelated(scriptUrl)) {
        // Don't count non-ads scripts here.
        continue;
      }
      if (longTask.parent) {
        // Only show top-level tasks (i.e. ones with no parents).
        continue;
      }
      // Count excess long task time as "blocking time"
      const blockingTime = longTask.duration - LONG_TASK_DUR_MS;
      totalAdJsBlockingTime += blockingTime;

      const party = getNameOrTld(scriptUrl);
      const prevBlockingTime = adBlockingTimeByParty.get(party) || 0;
      adBlockingTimeByParty.set(party, prevBlockingTime + blockingTime);
    }

    /** @type {TableRow[]} */ const tableDetails = [];
    for (const [name, blockingTime] of adBlockingTimeByParty.entries()) {
      tableDetails.push({name, blockingTime});
    }
    // Sort in descending order
    tableDetails.sort((a, b) => b.blockingTime - a.blockingTime);

    const scoreOptions = context.options[context.settings.throttlingMethod]
       || context.options['provided'];

    return {
      score: Audit.computeLogNormalScore(scoreOptions, totalAdJsBlockingTime),
      numericValue: totalAdJsBlockingTime,
      numericUnit: 'millisecond',
      displayValue:
        str_(UIStrings.failureDisplayValue, {timeInMs: totalAdJsBlockingTime}),
      details: TotalAdBlockingTime.makeTableDetails(HEADINGS, tableDetails),
    };
  }
}

module.exports = TotalAdBlockingTime;
module.exports.UIStrings = UIStrings;
