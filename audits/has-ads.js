const {Audit} = require('lighthouse');

/**
 * Simple audit that checks for the presence of ads. Currently based on network
 * logs since it's simple for testing.
 */
class HasAds extends Audit {
  static get meta() {
    return {
      name: 'has-ads',
      description: 'Checks if the page has ads',
      failureDescription: 'something went wrong',
      helpText: 'Checks if the page has ads',
      requiredArtifacts: ['Ads'],
    }
  }

  static audit(artifacts) {
    return {
      rawValue: artifacts.Ads.numRequests,
      score: artifacts.Ads.numRequests > 0,
      displayValue: `${artifacts.Ads.numRequests} ad request(s)`,
    }
  }
}

module.exports = HasAds;
