const {auditNotApplicable} = require('../utils/builder');
const {Audit} = require('lighthouse');
const {getAdStartTime, getPageStartTime} = require('../utils/network-timing');

// Point of diminishing returns.
const PODR = 2000;
const MEDIAN = 2500;

/**
 * Audit to determine time for first ad request relative to page start.
 */
class AdRequestFromPageStart extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id: 'ad-request-from-page-start',
      title: 'Latency of first ad request (from page start)',
      failureTitle: 'Reduce latency of first ad request (from page start)',
      description: 'This measures the time for the first ad request to be' +
          ' made relative to the page load starting.',
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
    const adStartTime = getAdStartTime(networkRecords);
    const pageStartTime = getPageStartTime(networkRecords);


    if (pageStartTime < 0) {
      return auditNotApplicable('No successful network records');
    }
    if (adStartTime < 0) {
      return auditNotApplicable('No ads requested');
    }

    const adReqTime = (adStartTime - pageStartTime) * 1000;

    let normalScore = Audit.computeLogNormalScore(adReqTime, PODR, MEDIAN);

    // Results that have green text should be under passing category.
    if (normalScore >= .9) {
      normalScore = 1;
    }

    return {
      rawValue: adReqTime,
      score: normalScore,
      displayValue: Math.round(adReqTime).toLocaleString() + ' ms',
    };
  }
}

module.exports = AdRequestFromPageStart;
