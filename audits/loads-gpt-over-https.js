const {auditNotApplicable} = require('../utils/builder');
const {Audit} = require('lighthouse');
const {isGoogleAds, isGpt, isHttp, isHttps} = require('../utils/resource-classification');
const {URL} = require('url');

/**
 * Simple audit that checks if gpt is loaded over https.
 * Currently based on network logs since it covers statically and dynamically
 * loaded scripts from the main page and iframes.
 */
class LoadsGptOverHttps extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id: 'loads-gpt-over-https',
      title: 'Uses HTTPS to load GPT',
      description: 'For privacy and security always load GPT over HTTPS.',
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
    const parsedUrls = networkRecords
        .map((record) => new URL(record.url));

    const googleAdsEntries = parsedUrls.filter(isGoogleAds);

    let numGptHttpReqs = 0;
    let numGptHttpsReqs = 0;

    for (const url of googleAdsEntries) {
      if (isGpt(url)) {
        if (isHttp(url)) {
          numGptHttpReqs++;
        } else if (isHttps(url)) {
          numGptHttpsReqs++;
        }
      }
    }

    const details = {numGptHttpReqs, numGptHttpsReqs};

    if (numGptHttpReqs + numGptHttpsReqs == 0) {
      const returnVal = auditNotApplicable('GPT not requested');
      returnVal.details = details;
      return returnVal;
    }

    const pluralEnding = numGptHttpReqs == 1 ? '' : 's';

    return {
      rawValue: numGptHttpReqs,
      score: numGptHttpReqs > 0 ? 0 : 1,
      displayValue: numGptHttpReqs ?
        `${numGptHttpReqs} unsafe request${pluralEnding}` : '',
      details,
    };
  }
}

module.exports = LoadsGptOverHttps;
