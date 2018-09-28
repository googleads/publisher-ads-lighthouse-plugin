const array = require('../utils/array.js');
const {auditNotApplicable} = require('../utils/builder');
const {Audit} = require('lighthouse');
const {isAdTag} = require('../utils/resource-classification');
const {URL} = require('url');

/**
 * @param {LH.Artifacts.NetworkRequest} tagReq
 * @return {boolean}
 */
function isAsync(tagReq) {
  // Use request priority as proxy to determine if script tag is asynchronous.
  // See https://bugs.chromium.org/p/chromium/issues/detail?id=408229.
  return tagReq.priority == 'Low';
}

/** @inheritDoc */
class AsyncAdTags extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id: 'async-ad-tags',
      title: 'Ad tags are loaded asynchronously',
      failureTitle: 'Some ad script tags are loaded synchronously',
      description: 'Tags loaded synchronously block all content rendering ' +
          'until they are fetched and evaluated, consider using the `async` ' +
          'attribute for script tags to make them asynchronous.',
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
      return auditNotApplicable('No ad tags requested');
    }

    const numAsync = array.count(tagReqs, isAsync);
    const numTags = tagReqs.length;
    return {
      rawValue: numAsync === numTags,
      displayValue: numAsync < numTags ?
        `${numTags - numAsync} synchronous ad tags` : '',
    };
  }
}

module.exports = AsyncAdTags;
