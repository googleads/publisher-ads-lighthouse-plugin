const NetworkRecorder = require('lighthouse/lighthouse-core/lib/network-recorder');
const {auditNotApplicable} = require('../utils/builder');
const {Audit} = require('lighthouse');
const {getAdStartTime, getTagEndTime} = require('../utils/network-timing');

// Point of diminishing returns.
const PODR = 300;
const MEDIAN = 497;

/**
 * Audit to determine time for first ad request relative to tag load.
 */
class AdRequestFromTagLoad extends Audit {
  /**
   * @return {AuditMetadata}
   * @override
   */
  static get meta() {
    return {
      id: 'ad-request-from-tag-load',
      title: 'Latency of First Ad Request (From Tag Load)',
      description: 'This measures the time for the first ad request to be' +
          ' made relative to the tag loading',
      // @ts-ignore
      scoreDisplayMode: Audit.SCORING_MODES.NUMERIC,
      requiredArtifacts: ['Network'],
    };
  }

  /**
   * @param {Artifacts} artifacts
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts) {
    /** @type {Array<LH.WebInspector.NetworkRequest>} */
    const networkRecords =
        await NetworkRecorder.recordsFromLogs(artifacts.Network.networkEvents);

    const adStartTime = getAdStartTime(networkRecords);
    const tagEndTime = getTagEndTime(networkRecords);

    if (tagEndTime < 0) {
      return auditNotApplicable('No tag loaded.');
    }
    if (adStartTime < 0) {
      return auditNotApplicable('No ads requested.');
    }

    const adReqTime = (adStartTime - tagEndTime) * 1000;

    // @ts-ignore
    const normalScore = Audit.computeLogNormalScore(adReqTime, PODR, MEDIAN);

    return {
      rawValue: adReqTime,
      score: normalScore,
      displayValue: Math.round(adReqTime).toLocaleString() + ' ms',
    };
  }
}

module.exports = AdRequestFromTagLoad;
