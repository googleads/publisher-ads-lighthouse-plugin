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
const {auditNotApplicable, auditError} = require('../messages/common-strings');
const {Audit} = require('lighthouse');
const {isAdIframe} = require('../utils/resource-classification');

const UIStrings = {
  title: 'Ads to page-height ratio is within recommended range',
  failureTitle: 'Reduce ads to page-height ratio',
  description: 'The ads to page-height ratio can impact user ' +
  'experience and ultimately user retention. [Learn more](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/viewport-ad-density' +
  ').',
  displayValue: '{adDensity, number, percent} ads to page-height ratio',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

/**
 * @param {LH.Artifacts.IFrameElement[]} slots
 * @param {LH.Artifacts.ViewportDimensions} viewport
 * @return {number}
 */
function computeAdLength(slots, viewport) {
  // We compute ads to page-height ratio along the vertical axis per the spec.
  // On mobile this is straightforward since we can assume single-column
  // layouts, but not so on desktop. On desktop we take a sample of various
  // vertical lines and return the greatest sum of ad heights along one of
  // those lines.

  /** @type {Set<number>} */
  const scanLines = new Set([
    ...slots.map((s) => s.clientRect.left),
    ...slots.map((s) => s.clientRect.right),
  ].map((x) => Math.min(Math.max(1, x), viewport.innerWidth - 1)));

  slots = slots.sort((a, b) => a.clientRect.top !== b.clientRect.top ?
    a.clientRect.top - b.clientRect.top :
    a.clientRect.bottom - b.clientRect.bottom);

  let result = 0;
  for (const x of scanLines) {
    let adLengthAlongAxis = 0;
    let bottomSoFar = 0;
    for (const slot of slots) {
      if (x < slot.clientRect.left || x > slot.clientRect.right) {
        continue;
      }
      if (slot.isPositionFixed) {
        // Count position:fixed ads towards ads to page-height ratio even if
        // they overlap.
        adLengthAlongAxis += slot.clientRect.height;
        continue;
      }
      // Else we exclude overlapping heights from density calculation.
      const delta =
        slot.clientRect.bottom - Math.max(bottomSoFar, slot.clientRect.top);
      if (delta > 0) {
        adLengthAlongAxis += delta;
      }
      bottomSoFar = Math.max(bottomSoFar, slot.clientRect.bottom);
    }
    result = Math.max(result, adLengthAlongAxis);
  }
  return result;
}

/** @inheritDoc */
class ViewportAdDensity extends Audit {
  /**
   * @return {AuditMetadata}
   * @override
   */
  static get meta() {
    return {
      id: 'viewport-ad-density',
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
    const slots = artifacts.IFrameElements.filter(
      (slot) => isAdIframe(slot) &&
      slot.clientRect.width * slot.clientRect.height > 1 );

    if (!slots.length) {
      return auditNotApplicable.NoVisibleSlots;
    }

    if (viewport.innerHeight <= 0) {
      throw new Error(auditError.ViewportAreaZero);
    }

    const adsLength = computeAdLength(slots, viewport);

    // We measure document length based on the bottom ad so that it isn't skewed
    // by lazy loading.
    const adsBottom =
      Math.max(...slots.map((s) => s.clientRect.top + s.clientRect.height / 2));
    // TODO(warrengm): Implement a DocumentDimensions gatherer to ensure that
    // we don't exceed the footer.
    const documentLength = adsBottom + viewport.innerHeight;

    const adDensity = Math.min(1, adsLength / documentLength);
    const score = adDensity > 0.3 ? 0 : 1;
    return {
      score,
      numericValue: adDensity,
      numericUnit: 'unitless',
      displayValue: str_(UIStrings.displayValue, {adDensity}),
    };
  }
}

module.exports = ViewportAdDensity;
module.exports.UIStrings = UIStrings;
