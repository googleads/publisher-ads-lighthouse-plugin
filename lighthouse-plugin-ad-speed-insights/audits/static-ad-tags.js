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
const util = require('util');
const {auditNotApplicable} = require('../utils/builder');
const {AUDITS, NOT_APPLICABLE} = require('../messages/messages.js');
const {Audit} = require('lighthouse');
const {isGptTag, isStaticRequest} = require('../utils/resource-classification');
const {URL} = require('url');

const id = 'static-ad-tags';
const {
  title,
  failureTitle,
  failureDisplayValue,
  description,
} = AUDITS[id];

/**
 * Table headings for audits details sections.
 * @type {LH.Audit.Details.Table['headings']}
 */
const HEADINGS = [
  {
    key: 'url',
    itemType: 'url',
    text: 'Initiator',
  },
  {
    key: 'lineNumber',
    itemType: 'numeric',
    text: 'Line Number',
    granularity: 1,
  },
];

/**
 * @param {LH.Artifacts.NetworkRequest} dynamicReq
 * @return {{url: string, lineNumber: number}[]}
 */
function getDetailsTable(dynamicReq) {
  const table = [];
  const seen = new Set();
  for (let stack = dynamicReq.initiator.stack; stack; stack = stack.parent) {
    for (const {url, lineNumber} of stack.callFrames) {
      if (seen.has(url)) continue;
      table.push({url, lineNumber});
      seen.add(url);
    }
  }
  return table;
}

/**
 * Returns the estimated opportunity in loading GPT statically.
 * @param {LH.Artifacts.NetworkRequest} tagRequest
 * @param {LH.Artifacts.NetworkRequest[]} networkRecords
 * @return {number}
 */
function quantifyOpportunitySec(tagRequest, networkRecords) {
  // The first HTML-initiated request is the best possible load time.
  const firstResource = networkRecords.find((r) =>
    ['parser', 'preload'].includes(r.initiator.type) ||
    r.resourceType == 'Script');
  if (!firstResource) {
    return 0;
  }
  return tagRequest.startTime - firstResource.startTime;
}

/** @inheritDoc */
class StaticAdTags extends Audit {
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
      return auditNotApplicable(NOT_APPLICABLE.NO_TAG);
    }

    const numStatic = array.count(tagReqs, isStaticRequest);
    const numTags = tagReqs.length;

    const dynamicReq = tagReqs.find((r) => !isStaticRequest(r));
    const table = dynamicReq ? getDetailsTable(dynamicReq) : [];

    const failed = numStatic < numTags;
    let displayValue = '';
    if (failed) {
      const opportunitySec = quantifyOpportunitySec(tagReqs[0], networkRecords);
      if (opportunitySec > 0.1) {
        displayValue =
            util.format(failureDisplayValue, opportunitySec.toFixed(2));
      }
    }

    return {
      displayValue,
      rawValue: !failed,
      details: StaticAdTags.makeTableDetails(HEADINGS, table),
    };
  }
}

module.exports = StaticAdTags;
