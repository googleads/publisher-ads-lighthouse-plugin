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
const common = require('../messages/common-strings');
const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records');
const {auditNotApplicable} = require('../utils/builder');
const {Audit} = require('lighthouse');

const {isGptTag, isStaticRequest} = require('../utils/resource-classification');
const {URL} = require('url');
// @ts-ignore
const i18n = require('lighthouse/lighthouse-core/lib/i18n/i18n.js');

/** @typedef {LH.Artifacts.NetworkRequest} NetworkRequest */
/** @typedef {LH.Gatherer.Simulation.NodeTiming} NodeTiming */

const UIStrings = {
  title: 'GPT tag is loaded statically',
  failureTitle: 'Load GPT tag statically',
  description: 'Tags loaded dynamically are not visible to the browser ' +
  'preloader. Consider using a static tag or `<link rel=\"preload\">` so the ' +
  'browser may load GPT sooner. [Learn more](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/static-ad-tags' +
  ').',
  failureDisplayValue: 'Up to {opportunity, number, seconds} s tag load time ' +
  'improvement',
  columnUrl: 'Initiator',
  columnLineNumber: 'Line Number',
};

const str_ = i18n.createMessageInstanceIdFn(__filename,
  Object.assign(UIStrings, common.UIStrings));
/**
 * Table headings for audits details sections.
 * @type {LH.Audit.Details.Table['headings']}
 */
const HEADINGS = [
  {
    key: 'url',
    itemType: 'url',
    text: str_(UIStrings.columnUrl),
  },
  {
    key: 'lineNumber',
    itemType: 'numeric',
    text: str_(UIStrings.columnLineNumber),
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
      id: 'static-ad-tags',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
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
      return auditNotApplicable(str_(common.UIStrings.NOT_APPLICABLE__NO_TAG));
    }

    const numStatic = array.count(tagReqs, isStaticRequest);
    const numTags = tagReqs.length;

    const dynamicReq = tagReqs.find((r) => !isStaticRequest(r));
    const table = dynamicReq ? getDetailsTable(dynamicReq) : [];

    const failed = numStatic < numTags;
    let displayValue = '';
    if (failed) {
      const opportunity = quantifyOpportunitySec(tagReqs[0], networkRecords);
      if (opportunity > 0.1) {
        displayValue = str_(UIStrings.failureDisplayValue, {opportunity});
      }
    }

    return {
      displayValue,
      score: Number(!failed),
      details: StaticAdTags.makeTableDetails(HEADINGS, table),
    };
  }
}

module.exports = StaticAdTags;
module.exports.UIStrings = UIStrings;
