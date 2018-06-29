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
      description: 'Checks if Ad Tags are loaded using async',
      helpText: 'Checks if the ad script tags are async',
      requiredArtifacts: ['StaticAdTags'],
    };
  }

  /**
   * @override
   * @param {Artifacts} artifacts
   * @return {LH.Audit.Product}
   */
  static audit(artifacts) {
    const tags = artifacts.StaticAdTags || [];
    const numAsync = array.count(tags, hasAsync);
    const numTags = tags.length;
    return {
      rawValue: numAsync === numTags,
      displayValue: `${numAsync} / ${numTags} static ad tags use async`,
    };
  }
}

module.exports = AsyncAdTags;
