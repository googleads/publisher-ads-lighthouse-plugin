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

import {auditNotApplicable} from '../messages/common-strings.js';

import {Audit} from 'lighthouse';
import * as i18n from 'lighthouse/lighthouse-core/lib/i18n/i18n.js';
import {isBoxInViewport} from '../utils/geometry.js';
import {isGptIframe} from '../utils/resource-classification.js';

const UIStrings = {
  title: 'Few or no ads loaded outside viewport',
  failureTitle: 'Avoid loading ads until they are nearly on-screen',
  description: 'Too many ads loaded outside the viewport lowers viewability ' +
  'rates and impacts user experience. Consider loading ads below the fold ' +
  'lazily as the user scrolls down. Consider using GPT\'s [Lazy Loading API](' +
  'https://developers.google.com/doubleclick-gpt/reference#googletag.PubAdsService_enableLazyLoad' +
  '). [Learn more](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/ads-in-viewport' +
  ').',
  failureDisplayValue: '{hiddenAds, plural, =1 {1 ad} ' +
  'other {# ads}} out of view',
  columnSlot: 'Slots Outside Viewport',
};

const str_ = i18n.createMessageInstanceIdFn(import.meta.url, UIStrings);

/**
 * Table headings for audits details sections.
 * @type {LH.Audit.Details.Table['headings']}
 */
const HEADINGS = [
  {key: 'slot', itemType: 'text', text: str_(UIStrings.columnSlot)},
];

/** @inheritDoc */
class AdsInViewport extends Audit {
  /**
   * @return {AuditMetadata}
   * /override This member cannot have a JSDoc comment with an '@override' tag because its containing class ... does not extend another class.
   */
  static get meta() {
    return {
      id: 'ads-in-viewport',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      requiredArtifacts: ['ViewportDimensions', 'IFrameElements'],
    };
  }

  /**
   * @param {Artifacts} artifacts
   * @return {LH.Audit.Product}
   */
  static audit(artifacts) {
    const viewport = artifacts.ViewportDimensions;
    const slots = artifacts.IFrameElements
        .filter((iframe) => isGptIframe(iframe) &&
          iframe.clientRect.height * iframe.clientRect.width > 1);

    if (!slots.length) {
      return auditNotApplicable.NoVisibleSlots;
    }

    /** @type {Array<{slot: string}>} */
    const nonvisible = slots
        .filter((slot) => !isBoxInViewport(slot.clientRect, viewport))
        .map((slot) => ({slot: slot.id}))
        .sort((a, b) => a.slot.localeCompare(b.slot));

    const visibleCount = slots.length - nonvisible.length;

    return {
      numericValue: visibleCount / slots.length,
      numericUnit: 'unitless',
      score: nonvisible.length > 3 ? 0 : 1,
      displayValue: nonvisible.length ?
        str_(UIStrings.failureDisplayValue, {hiddenAds: nonvisible.length}) :
        '',
      details: AdsInViewport.makeTableDetails(HEADINGS, nonvisible),
    };
  }
}

export default AdsInViewport;
export {UIStrings};
