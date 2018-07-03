const {isGoogleAds, hasAdRequestPath, hasImpressionPath} = require('../utils/resource-classification');
const {Audit} = require('lighthouse');

/**
 * Simple audit that checks for the presence of ads. Currently based on network
 * logs since it's simple for testing.
 */
class HasAds extends Audit {
  /**
   * @return {AuditMetadata}
   * @override
   */
  static get meta() {
    return {
      name: 'has-ads',
      description: 'Checks if the page has ads',
      failureDescription: 'something went wrong',
      helpText: 'Checks if the page has ads',
      requiredArtifacts: ['Network'],
    };
  }

  /**
   * @param {Artifacts} artifacts
   * @return {LH.Audit.Product}
   */
  static audit(artifacts) {
    const {parsedUrls} = artifacts.Network;

    const googleAdsEntries = parsedUrls.filter(isGoogleAds);

    let numRequests = 0;
    let numImpressions = 0;

    for (const url of googleAdsEntries) {
      if (hasAdRequestPath(url)) {
        numRequests++;
      } else if (hasImpressionPath(url)) {
        numImpressions++;
      }
    }

    return {
      rawValue: numRequests,
      score: numRequests > 0 ? 1 : 0,
      displayValue:
          `${numRequests} ad request(s); ${numImpressions} ad impression(s)`,
      details: {
        numRequests,
        numImpressions,
      },
    };
  }
}

module.exports = HasAds;
