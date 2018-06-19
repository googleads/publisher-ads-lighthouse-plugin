const array = require('../utils/array.js');
const {Audit} = require('lighthouse');

/**
 * @param {LH.Crdp.DOM.Node} tag
 * @return {boolean}
 */
function hasAsync(tag) {
  return !!tag.attributes && tag.attributes.includes('async');
}

/** @inheritDoc */
class AsyncAdTags extends Audit {
  /** @override */
  static get meta() {
    return {
      name: 'async-ad-tags',
      helpText: 'Checks if the ad script tags are async',
      scoreDisplayMode: 'binary',
      description: 'Passes iff the page loads an ad tag statically and ' +
          'asynchronously. To improve loading times, GPT should be loaded ' +
          'directly in the page as <script async src=".../gpt.js">.',
      failureDescription: 'gpt.js is not loaded as an async script tag',
      requiredArtifacts: ['StaticAdTags'],
    };
  }

  /**
   * @param {Artifacts} artifacts
   * @return {LH.Audit.Product}
   * @override
   */
  static audit(artifacts) {
    const tags = artifacts.StaticAdTags || [];
    const numAsync = array.count(tags, hasAsync);
    const numTags = tags.length;
    return {
      rawValue: numAsync === numTags,
      score: numAsync > 0 ? 1 : 0,
      displayValue: `${numAsync} / ${numTags} static ad tags use async`,
    };
  }
}

module.exports = AsyncAdTags;
