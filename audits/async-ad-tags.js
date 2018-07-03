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
  /**
   * @return {AuditMetadata}
   * @override
   */
  static get meta() {
    return {
      id: 'async-ad-tags',
      title: 'Static ad tags are loaded asynchronously',
      failureTitle: 'Some static ad script tags are loaded synchronously',
      description: 'Static tags loaded synchronously block all content ' +
          'until they are fetched and evaluated, consider using the async ' +
          'attribute for script tags to make them asynchronous.',
      requiredArtifacts: ['StaticAdTags'],
    };
  }

  /**
   * @param {Artifacts} artifacts
   * @return {LH.Audit.Product}
   * @override
   */
  static audit(artifacts) {
    const tags = artifacts.StaticAdTags;
    const numAsync = array.count(tags, hasAsync);
    const numTags = tags.length;
    return {
      rawValue: numAsync === numTags,
      displayValue: `${numAsync} / ${numTags} static ad tags use async`,
    };
  }
}

module.exports = AsyncAdTags;
