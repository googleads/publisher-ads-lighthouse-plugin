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

const NetworkRecords = require('lighthouse/lighthouse-core/gather/computed/network-records');
const {auditNotApplicable} = require('../utils/builder');
const {Audit} = require('lighthouse');
const {hasAdRequestPath} = require('../utils/resource-classification');
const {URL} = require('url');

/** @inheritDoc */
class FullWidthSlots extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id: 'full-width-slots',
      title: 'Slots are utilizing most of the viewport width',
      failureTitle: 'Slots are not utilizing the full viewport width',
      description: 'Have ad slot sizes that utilize most of the viewport\'s ' +
      'width to increase CTR. We recommend leaving no more than 20% of the ' +
      'viewport\'s width unutilized. [Learn more.]' +
      '(https://ad-speed-insights.appspot.com/#full-width-slots)',
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
        .map((record) => new URL(record.url))
        .filter(hasAdRequestPath);

    if (!adRequestUrls.length) {
      return auditNotApplicable('No ads requested');
    }

    const sizeArrs = adRequestUrls.map((url) =>
      url.searchParams.get('prev_iu_szs') || url.searchParams.get('sz'));

    // Converts to array of widths, filtering out those larger than viewport
    // that are at least 1px wide.
    const sizes = sizeArrs.join('|').split(/[|,]/);

    const widths = sizes.map((size) => parseInt(size.split('x')[0]))
        .filter((w) => w <= vpWidth && w > 1);

    if (!widths.length) {
      return auditNotApplicable('No requested ads contain ads of valid width');
    }

    const maxWidth = Math.max(...widths);

    const pctUnoccupied = 1 - (maxWidth / vpWidth);

    const score = pctUnoccupied > .2 ? 0 : 1;


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
