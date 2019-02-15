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
const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records');
const {auditNotApplicable} = require('../utils/builder');
const {Audit} = require('lighthouse');
const {isGptTag} = require('../utils/resource-classification');
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
          'asynchronously. [Learn more.]' +
          '(https://ad-speed-insights.appspot.com/#async-tags)',
      requiredArtifacts: ['devtoolsLogs'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts, context) {
    const devtoolsLogs = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const networkRecords = await NetworkRecords.request(devtoolsLogs, context);
    const tagReqs = networkRecords
        .filter((req) => isGptTag(new URL(req.url)));

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
