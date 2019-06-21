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
// @ts-ignore
const MainResource = require('lighthouse/lighthouse-core/computed/main-resource');
const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records');
const {auditNotApplicable} = require('../utils/builder');
const {AUDITS, NOT_APPLICABLE} = require('../messages/messages');
const {Audit} = require('lighthouse');
const {isGptTag, isStaticRequest} = require('../utils/resource-classification');
const {URL} = require('url');

const id = 'async-ad-tags';
const {
  title,
  failureTitle,
  description,
} = AUDITS[id];

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
      id,
      title,
      failureTitle,
      description,
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
        .filter((req) => isGptTag(new URL(req.url)))
        .filter((req) => req.frameId === mainResource.frameId);

    if (!tagReqs.length) {
      return auditNotApplicable(NOT_APPLICABLE.NO_TAG);
    }

    const numAsync = array.count(tagReqs, isAsync);
    const numTags = tagReqs.length;
    return {
      score: Number(numAsync === numTags),
    };
  }
}

module.exports = AsyncAdTags;
