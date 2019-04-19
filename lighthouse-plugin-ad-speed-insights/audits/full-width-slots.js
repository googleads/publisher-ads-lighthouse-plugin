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

const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records');
const {auditNotApplicable} = require('../utils/builder');
const {AUDITS, NOT_APPLICABLE} = require('../messages/en-US.js');
const {Audit} = require('lighthouse');
const {isGptAdRequest} = require('../utils/resource-classification');
const {URL} = require('url');

/** @inheritDoc */
class FullWidthSlots extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    const id = 'full-width-slots';
    const {title, failureTitle, description} = AUDITS[id];
    return {
      id,
      title,
      failureTitle,
      description,
      requiredArtifacts: ['ViewportDimensions', 'devtoolsLogs'],
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
    const viewport = artifacts.ViewportDimensions;
    const vpWidth = viewport.innerWidth;

    /** @type {Array<URL>} */
    const adRequestUrls = networkRecords
        .filter(isGptAdRequest)
        .map((record) => new URL(record.url));

    if (!adRequestUrls.length) {
      return auditNotApplicable(NOT_APPLICABLE.NO_ADS);
    }

    const sizeArrs = adRequestUrls.map((url) =>
      url.searchParams.get('prev_iu_szs') || url.searchParams.get('sz'));

    // Converts to array of widths, filtering out those larger than viewport
    // that are at least 1px wide.
    const sizes = sizeArrs.join('|').split(/[|,]/);

    const widths = sizes.map((size) => parseInt(size.split('x')[0]))
        .filter((w) => w <= vpWidth && w > 1);

    if (!widths.length) {
      return auditNotApplicable(NOT_APPLICABLE.NO_VALID_AD_WIDTHS);
    }

    const maxWidth = Math.max(...widths);

    const pctUnoccupied = 1 - (maxWidth / vpWidth);

    const score = pctUnoccupied > .25 ? 0 : 1;


    return {
      score,
      rawValue: pctUnoccupied,
      // No displayValue if passing, no changes to be made.
      displayValue: score ? ''
        : Math.round(pctUnoccupied * 100) + '% of viewport width is unused',
    };
  }
}

module.exports = FullWidthSlots;
