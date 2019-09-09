// Copyright 2019 Google LLC
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

const i18n = require('lighthouse/lighthouse-core/lib/i18n/i18n');
const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records');
// @ts-ignore
const RenderBlockingResources = require('lighthouse/lighthouse-core/audits/byte-efficiency/render-blocking-resources.js');
const {auditNotApplicable} = require('../messages/common-strings');
const {Audit} = require('lighthouse');
const {getPageStartTime} = require('../utils/network-timing');
const {isAdTag} = require('../utils/resource-classification');
const {URL} = require('url');

const UIStrings = {
  title: 'Minimal render-blocking resources found',
  failureTitle: 'Avoid render-blocking resources',
  description: 'Render-blocking resources slow down tag load times. Consider ' +
  'loading critical JS/CSS inline or loading scripts asynchronously or ' +
  'loading the tag earlier in the head. [Learn more](' +
  'https://developers.google.com/web/tools/lighthouse/audits/blocking-resources' +
  ').',
  failureDisplayValue: 'Up to {timeInMs, number, seconds} s tag load time ' +
  'improvement',
  columnUrl: 'Resource',
  columnStartTime: 'Start',
  columnDuration: 'Duration',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

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
    key: 'startTime',
    itemType: 'ms',
    text: str_(UIStrings.columnStartTime),
    granularity: 1,
  },
  {
    key: 'duration',
    itemType: 'ms',
    text: str_(UIStrings.columnDuration),
    granularity: 1,
  },
];

/** Audits for render blocking resources */
class AdRenderBlockingResources extends RenderBlockingResources {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id: 'ad-render-blocking-resources',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      scoreDisplayMode: 'binary',
      description: str_(UIStrings.description),
      requiredArtifacts: RenderBlockingResources.meta.requiredArtifacts,
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
    const hasTag = !!networkRecords.find((req) => isAdTag(new URL(req.url)));
    if (!hasTag) {
      return auditNotApplicable.NoTag;
    }

    const {results} = await RenderBlockingResources.computeResults(
      artifacts, context);

    const pageStartTime = getPageStartTime(networkRecords);
    const tableView = results
        // @ts-ignore
        .map((r) => networkRecords.find((n) => n.url === r.url))
        .filter(Boolean)
        // @ts-ignore
        .map((record) => ({
          url: record.url,
          // TODO: line number
          startTime: (record.startTime - pageStartTime) * 1000,
          endTime: (record.endTime - pageStartTime) * 1000,
          duration: (record.endTime - record.startTime) * 1000,
        }));

    // @ts-ignore
    const opportunity = Math.max(...tableView.map((r) => r.duration));
    let displayValue = '';
    if (results.length > 0 && opportunity > 0) {
      displayValue = str_(
        UIStrings.failureDisplayValue, {timeInMs: opportunity});
    }

    return {
      numericValue: results.length,
      score: results.length ? 0 : 1,
      displayValue,
      details: AdRenderBlockingResources.makeTableDetails(HEADINGS, tableView),
    };
  }
}

module.exports = AdRenderBlockingResources;
module.exports.UIStrings = UIStrings;
