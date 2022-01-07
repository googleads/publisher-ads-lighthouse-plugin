// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const array = require('../utils/array.js');
const i18n = require('lighthouse/lighthouse-core/lib/i18n/i18n.js');
// @ts-ignore
const MainResource = require('lighthouse/lighthouse-core/computed/main-resource.js');
const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records.js');
const {auditNotApplicable} = require('../messages/common-strings');
const {Audit} = require('lighthouse');
const {isAdTag, isStaticRequest} = require('../utils/resource-classification');

const UIStrings = {
  title: 'Ad tag is loaded asynchronously',
  failureTitle: 'Load ad tag asynchronously',
  description: 'Loading the ad tag synchronously blocks content rendering ' +
  'until the tag is fetched and loaded. Consider using the `async` attribute ' +
  'to load gpt.js and/or adsbygoogle.js asynchronously. [Learn more](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/async-ad-tags' +
  ').',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);
/**
 * @param {LH.Artifacts.NetworkRequest} tagReq
 * @return {boolean}
 */
function isAsync(tagReq) {
  // Use request priority as proxy to determine if script tag is asynchronous.
  // See https://bugs.chromium.org/p/chromium/issues/detail?id=408229.
  // If preload, priority will be `High`, assume async in that case.
  // TODO(jburger): Properly handle preload && !async case.
  return tagReq.priority == 'Low' || isStaticRequest(tagReq);
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
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      requiredArtifacts: ['devtoolsLogs', 'URL'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts, context) {
    const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const networkRecords = await NetworkRecords.request(devtoolsLog, context);
    const mainResource =
        await MainResource.request({URL: artifacts.URL, devtoolsLog}, context);
    const tagReqs = networkRecords
        .filter((req) => isAdTag(new URL(req.url)))
        .filter((req) => req.frameId === mainResource.frameId);

    if (!tagReqs.length) {
      return auditNotApplicable.NoTag;
    }

    const numSync = array.count(tagReqs, isAsync) - tagReqs.length;
    const passed = (numSync === 0);
    return {
      score: Number(passed),
      numericValue: numSync,
      numericUnit: 'unitless',
    };
  }
}

module.exports = AsyncAdTags;
module.exports.UIStrings = UIStrings;
