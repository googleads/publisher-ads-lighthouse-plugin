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

const i18n = require('lighthouse/lighthouse-core/lib/i18n/i18n');
const {auditNotApplicable, auditError} = require('../messages/common-strings');
const {Audit} = require('lighthouse');
const {boxViewableArea} = require('../utils/geometry');
const {isAdIframe} = require('../utils/resource-classification');

const UIStrings = {
  title: 'Ad density in initial viewport is within recommended range',
  failureTitle: 'Reduce ad density in initial viewport',
  description: 'The ads-to-content ratio inside the viewport can have an ' +
  'impact on user experience and ultimately user retention. The Better Ads ' +
  'Standard [recommends having an ad density below 30%]' +
  '(https://www.betterads.org/mobile-ad-density-higher-than-30/). ' +
  '[Learn more](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/viewport-ad-density' +
  ').',
  displayValue: '{adDensity, number, percent} covered by ads',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

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
      (slot) => isAdIframe(slot) && slot.isVisible);

    if (!slots.length) {
      return auditNotApplicable.NoVisibleSlots;
    }

    const adArea = slots.reduce((sum, slot) =>
      sum + boxViewableArea(slot.clientRect, viewport), 0);

    const viewArea = viewport.innerWidth * viewport.innerHeight;

    if (viewArea <= 0) {
      throw new Error(auditError.ViewportAreaZero);
    }
    if (adArea > viewArea) {
      throw new Error(auditError.AreaLargerThanViewport);
    }
    const adDensity = adArea / viewArea;
    const score = adDensity > 0.3 ? 0 : 1;
    return {
      score,
      numericValue: adArea / viewArea,
      displayValue: str_(UIStrings.displayValue, {adDensity}),
    };
  }
}

module.exports = ViewportAdDensity;
module.exports.UIStrings = UIStrings;
