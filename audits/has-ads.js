const {Audit} = require('lighthouse');

/**
 * Simple audit that checks for the presence of ads. Currently based on network
 * logs since it's simple for testing.
 */
class HasAds extends Audit {
  /** @override */
  static get meta() {
    return {
      name: 'has-ads',
      description: 'Checks if the page has ads',
      failureDescription: 'something went wrong',
      helpText: 'Checks if the page has ads',
      requiredArtifacts: ['Ads'],
    };
  }

  /** @override */
  static audit(artifacts) {
    const {numRequests, numImpressions} = artifacts.Ads;
    return {
      rawValue: artifacts.Ads.numRequests,
      score: artifacts.Ads.numRequests > 0,
      displayValue:
          `${numRequests} ad request(s); ${numImpressions} ad impression(s)`,
    };
  }
}

module.exports = HasAds;
