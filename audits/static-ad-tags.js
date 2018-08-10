const array = require('../utils/array.js');
const {Audit} = require('lighthouse');
const {URL} = require('url');

const {isAdTag} = require('../utils/resource-classification');

/**
 * @param {LH.WebInspector.NetworkRequest} tagReq
 * @return {boolean}
 */
function isStatic(tagReq) {
  // Use initiator type to determine if tag was loaded statically.
  return ['parser', 'preload'].includes(tagReq._initiator.type);
}

/** @inheritDoc */
class StaticAdTags extends Audit {
  /**
   * @return {AuditMetadata}
   * @override
   */
  static get meta() {
    return {
      id: 'static-ad-tags',
      title: 'Ad tags are loaded statically',
      failureTitle: 'Some ad script tags are loaded dynamically',
      description: 'Tags loaded dynamically are not visible to the browser ' +
        'preloader, consider using a static tag or `<link rel="preload">`.',
      requiredArtifacts: ['Network'],
    };
  }

  /**
   * @param {Artifacts} artifacts
   * @return {LH.Audit.Product}
   * @override
   */
  static audit(artifacts) {
    const {networkRecords} = artifacts.Network;
    const tagReqs = networkRecords.filter((req) => isAdTag(new URL(req.url)));
    const numStatic = array.count(tagReqs, isStatic);
    const numTags = tagReqs.length;
    return {
      rawValue: numStatic === numTags,
      displayValue: numStatic < numTags ?
        `${numTags - numStatic} dynamic ad tags` : '',
    };
  }
}

module.exports = StaticAdTags;
