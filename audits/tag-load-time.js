const {auditNotApplicable} = require('../utils/builder');
const {Audit} = require('lighthouse');
const {getPageStartTime, getTagEndTime} = require('../utils/network-timing');
// Point of diminishing returns.
const PODR = 500;
const MEDIAN = 1000;
/**
 * Audit to determine time for tag to load relative to page start.
 */
class TagLoadTime extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id: 'tag-load-time',
      title: 'Tag load time',
      failureTitle: 'Reduce tag load time',
      description: 'This measures the time for the Google Publisher' +
          ' Tag\'s implementation script (pubads_impl.js) to load after the page loads.',
      // @ts-ignore
      scoreDisplayMode: Audit.SCORING_MODES.NUMERIC,
      requiredArtifacts: ['devtoolsLogs'],
    };
  }
  /**
   * @param {LH.Artifacts} artifacts
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts) {
    const devtoolsLogs = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const networkRecords = await artifacts.requestNetworkRecords(devtoolsLogs);
    const pageStartTime = getPageStartTime(networkRecords);
    const tagEndTime = getTagEndTime(networkRecords);
    if (pageStartTime < 0) {
      return auditNotApplicable('No successful network records');
    }
    if (tagEndTime < 0) {
      return auditNotApplicable('No tag loaded');
    }
    const tagLoadTime = (tagEndTime - pageStartTime) * 1000;

    let normalScore = Audit.computeLogNormalScore(tagLoadTime, PODR, MEDIAN);

    // Results that have green text should be under passing category.
    if (normalScore >= .9) {
      normalScore = 1;
    }

    return {
      rawValue: tagLoadTime,
      score: normalScore,
      displayValue: Math.round(tagLoadTime).toLocaleString() + ' ms',
    };
  }
}
module.exports = TagLoadTime;
