const array = require('../utils/array.js');
const NetworkRecorder = require('lighthouse/lighthouse-core/lib/network-recorder');
const {Audit} = require('lighthouse');
const {URL} = require('url');

const {isAdTag} = require('../utils/resource-classification');

/**
 * @param {LH.WebInspector.NetworkRequest} tagReq
 * @return {boolean}
 */
function isAsync(tagReq) {
  // Use request priority as proxy to determine if script tag is asynchronous.
  // See https://bugs.chromium.org/p/chromium/issues/detail?id=408229.
  return tagReq.priority() == 'Low';
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
      title: 'Ad tags are loaded asynchronously',
      failureTitle: 'Some ad script tags are loaded synchronously',
      description: 'Tags loaded synchronously block all content rendering ' +
          'until they are fetched and evaluated, consider using the `async` ' +
          'attribute for script tags to make them asynchronous.',
      requiredArtifacts: ['Network'],
    };
  }

  /**
   * @param {Artifacts} artifacts
   * @return {Promise<LH.Audit.Product>}
   * @override
   */
  static async audit(artifacts) {
    /** @type {Array<LH.WebInspector.NetworkRequest>} */
    const networkRecords =
        await NetworkRecorder.recordsFromLogs(artifacts.Network.networkEvents);
    const tagReqs = networkRecords.filter((req) => isAdTag(new URL(req.url)));
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
