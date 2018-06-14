const {isGoogleAds, isGpt, isHttp, isHttps} = require('../utils/resource-classification');
const {Audit} = require('lighthouse');

/**
 * Simple audit that checks if gpt is loaded over https.
 * Currently based on network logs since it covers statically and dynamically
 * loaded scripts from the main page and iframes.
 */
class LoadsGptOverHttps extends Audit {
  /** @override */
  static get meta() {
    return {
      name: 'loads-gpt-over-https',
      description: 'Checks if the page requests gpt.js over HTTPS',
      helpText: 'Determines if a publisher/page uses HTTPS to requests ads',
      requiredArtifacts: ['Network'],
    };
  }

  /**
   * @param {!Artifacts} artifacts
   * @return {!LH.Audit.Product}
   */
  static audit(artifacts) {
    const {parsedUrls} =
    /** @type {!NetworkArtifacts} */ (artifacts.Network);

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

    return {
      rawValue: numGptHttpReqs,
      score: numGptHttpReqs > 0 ? 0 : 1,
      displayValue:
          `${numGptHttpReqs} gpt.js HTTP request(s);
              ${numGptHttpsReqs} gpt.js HTTPS requests(s)`,
      details: {
        numGptHttpReqs,
        numGptHttpsReqs,
      },
    };
  }
}

module.exports = LoadsGptOverHttps;
