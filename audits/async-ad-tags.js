const array = require('../utils/array.js');
const {auditNotApplicable} = require('../utils/builder');
const {Audit} = require('lighthouse');
const {isGpt} = require('../utils/resource-classification');
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
      title: 'GPT tag is loaded asynchronously',
      failureTitle: 'GPT tag is loaded synchronously',
      description: 'Loading the GPT tag synchronously blocks all content ' +
          'rendering until the tag is fetched and evaluated, consider using ' +
          'the `async` attribute for the GPT tag to ensure it is loaded ' +
          'asynchronously.',
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
        .filter((req) => isGpt(new URL(req.url)));

    if (!tagReqs.length) {
      return auditNotApplicable('No tag requested');
    }

    const numAsync = array.count(tagReqs, isAsync);
    const numTags = tagReqs.length;
    return {
      rawValue: numAsync === numTags,
    };
  }
}

module.exports = AsyncAdTags;
