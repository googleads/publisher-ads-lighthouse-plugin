const array = require('../utils/array.js');
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
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id: 'static-ad-tags',
      title: 'Ad tags are loaded statically',
      failureTitle: 'Some ad script tags are loaded dynamically',
      description: 'Tags loaded dynamically are not visible to the browser ' +
        'preloader, consider using a static tag or `<link rel="preload">`.',
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
    const tagReqs = networkRecords
        .filter((req) => isAdTag(new URL(req.url)));

    if (!tagReqs.length) {
      return auditNotApplicable('No ad tags requested.');
    }

    const numStatic = array.count(tagReqs, isStatic);
    const numTags = tagReqs.length;
    const numDynamic = numTags - numStatic;

    const pluralEnding = numDynamic == 1 ? '' : 's';
    return {
      rawValue: numStatic === numTags,
      displayValue: numStatic < numTags ?
        `${numDynamic} dynamic ad tag${pluralEnding}` : '',
    };
  }
}

module.exports = StaticAdTags;
