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

const i18n = require('lighthouse/lighthouse-core/lib/i18n/i18n.js');
const {auditNotApplicable} = require('../messages/common-strings');
const {Audit} = require('lighthouse');
const {isAdIframe} = require('../utils/resource-classification');

const UIStrings = {
  title: 'No ad found at the very top of the viewport',
  failureTitle: 'Move the top ad further down the page',
  description: 'Over 10% of ads are never viewed because users scroll past ' +
  'them before they become viewable. By moving ad slots away from the very ' +
  'top of the viewport, users are more likely to see ads before scrolling ' +
  'away. [Learn more](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/ad-top-of-viewport' +
  ').',
  failureDisplayValue: 'A scroll of {valueInPx, number} px would hide half of your topmost ad',
  columnSlot: 'Top Slot ID',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);


const SCROLL_PX_THRESHOLD = 100;

/**
 * Table headings for audits details sections.
 * @type {LH.Audit.Details.Table['headings']}
 */
const HEADINGS = [
  {key: 'slot', itemType: 'text', text: str_(UIStrings.columnSlot)},
];


/** @inheritDoc */
class AdTopOfViewport extends Audit {
  /**
   * @return {AuditMetadata}
   * @override
   */
  static get meta() {
    return {
      id: 'ad-top-of-viewport',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      requiredArtifacts: ['ViewportDimensions', 'IFrameElements'],
    };
  }

  /**
   * @override
   * @param {Artifacts} artifacts
   * @return {LH.Audit.Product}
   */
  static audit(artifacts) {
    const viewport = artifacts.ViewportDimensions;
    const slots = artifacts.IFrameElements.filter(isAdIframe)
        .filter((slot) =>
          slot.clientRect.width * slot.clientRect.height > 1
          && !slot.isPositionFixed)
        .map((slot) => ({
          midpoint: slot.clientRect.top + slot.clientRect.height / 2,
          id: slot.id,
        }));

    if (!slots.length) {
      return auditNotApplicable.NoVisibleSlots;
    }

    const topSlot = slots.reduce((a, b) => (a.midpoint < b.midpoint) ? a : b);

    const inViewport = topSlot.midpoint < viewport.innerHeight;

    if (!inViewport) {
      return auditNotApplicable.NoAdsViewport;
    }

    const score = inViewport && topSlot.midpoint < SCROLL_PX_THRESHOLD ? 0 : 1;

    return {
      score,
      numericValue: topSlot.midpoint,
      numericUnit: 'unitless',
      // No displayValue if passing, no changes to be made.
      displayValue: score ? '' :
        str_(UIStrings.failureDisplayValue, {valueInPx: topSlot.midpoint}),
      details: AdTopOfViewport.makeTableDetails(
        HEADINGS,
        score ? [] : [{slot: topSlot.id}],
      ),
    };
  }
}

module.exports = AdTopOfViewport;
module.exports.UIStrings = UIStrings;
