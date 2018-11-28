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

const {auditNotApplicable} = require('../utils/builder');
const {Audit} = require('lighthouse');
const {isBoxInViewport} = require('../utils/geometry');

/**
 * Table headings for audits details sections.
 * @type {LH.Audit.Heading[]}
 */
const HEADINGS = [
  {key: 'slot', itemType: 'text', text: 'Slots Outside Viewport'},
];

/** @inheritDoc */
class AdsInViewport extends Audit {
  /**
   * @return {AuditMetadata}
   * @override
   */
  static get meta() {
    return {
      id: 'ads-in-viewport',
      title: 'Few or no ads loaded outside viewport',
      failureTitle: 'There are eager ads loaded outside viewport',
      description: 'Too many ads loaded outside the viewport lowers ' +
          'viewability rates and impact user experience, consider loading ' +
          'ads below the fold lazily as the user scrolls down. Consider ' +
          'using GPT\'s [Lazy Loading API]' +
          '(https://developers.google.com/doubleclick-gpt/reference' +
          '#googletag.PubAdsService_enableLazyLoad).',
      requiredArtifacts: ['ViewportDimensions', 'RenderedAdSlots'],
    };
  }

  /**
   * @param {Artifacts} artifacts
   * @return {LH.Audit.Product}
   */
  static audit(artifacts) {
    const viewport = artifacts.ViewportDimensions;
    const slots = artifacts.RenderedAdSlots.filter((slot) => slot);

    if (!slots.length) {
      return auditNotApplicable('No slots on page.');
    }
    // Checks that non-null (visible) slots exist in array.
    if (!slots.find((s) => s != null)) {
      return auditNotApplicable('No visible slots on page.');
    }

    /** @type {Array<{slot: string}>} */
    const nonvisible = slots
        .filter((slot) => slot && !isBoxInViewport(slot, viewport))
        .map((slot) => ({slot: slot.id}))
        .sort((a, b) => a.slot.localeCompare(b.slot));
    const visibleCount = slots.length - nonvisible.length;

    const pluralEnding = nonvisible.length == 1 ? '' : 's';

    return {
      rawValue: visibleCount / slots.length,
      score: nonvisible.length > 3 ? 0 : 1,
      displayValue: nonvisible.length ?
        `${nonvisible.length} ad${pluralEnding} out of view` : '',
      details: AdsInViewport.makeTableDetails(HEADINGS, nonvisible),
    };
  }
}

module.exports = AdsInViewport;
