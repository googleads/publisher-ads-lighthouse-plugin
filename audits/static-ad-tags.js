const array = require('../utils/array.js');
const NetworkRecorder = require('lighthouse/lighthouse-core/lib/network-recorder');
const {auditNotApplicable} = require('../utils/builder');
const {Audit} = require('lighthouse');
const {isAdTag} = require('../utils/resource-classification');
const {URL} = require('url');

/**
 * @param {LH.Artifacts.NetworkRequest} tagReq
 * @return {boolean}
 */
function isStatic(tagReq) {
  // Use initiator type to determine if tag was loaded statically.
  return ['parser', 'preload'].includes(tagReq.initiator.type);
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
   * @return {Promise<LH.Audit.Product>}
   * @override
   */
  static async audit(artifacts) {
    /** @type {Array<LH.Artifacts.NetworkRequest>} */
    const networkRecords =
        await NetworkRecorder.recordsFromLogs(artifacts.Network.networkEvents);
    const tagReqs = networkRecords.filter((req) => isAdTag(new URL(req.url)));

    if (!tagReqs.length) {
      return auditNotApplicable('No ad tags requested.');
    }

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
