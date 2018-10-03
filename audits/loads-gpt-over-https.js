const {auditNotApplicable} = require('../utils/builder');
const {Audit} = require('lighthouse');
const {isGpt} = require('../utils/resource-classification');
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
      failureTitle: 'GPT is loaded insecurely',
      description: 'For privacy and security always load GPT over HTTPS. With' +
        ' insecure pages explicitly request the GPT script securely. Example:' +
        '`<script async="async" ' +
        'src="https://www.googletagservices.com/tag/js/gpt.js">`. [Learn More]' +
        '(https://support.google.com/admanager/answer/1638622?hl=en).',
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

    const pageReq = networkRecords.find((record) => record.statusCode == 200);
    if (!pageReq) {
      return auditNotApplicable('No successful network records');
    }

    const gptRequests = networkRecords
        .filter((record) => isGpt(new URL(record.url)));

    const secureGptRequests = gptRequests.filter((request) => request.isSecure);

    const details = {
      numGptHttpReqs: gptRequests.length - secureGptRequests.length,
      numGptHttpsReqs: secureGptRequests.length,
    };

    if (!gptRequests.length) {
      const returnVal = auditNotApplicable('GPT not requested');
      returnVal.details = details;
      return returnVal;
    }

    const pluralEnding = details.numGptHttpReqs == 1 ? '' : 's';
    return {
      rawValue: details.numGptHttpReqs,
      score: details.numGptHttpReqs ? 0 : 1,
      displayValue: details.numGptHttpReqs ?
        `${details.numGptHttpReqs} unsafe request${pluralEnding}` : '',
      details,
    };
  }
}

module.exports = LoadsGptOverHttps;
