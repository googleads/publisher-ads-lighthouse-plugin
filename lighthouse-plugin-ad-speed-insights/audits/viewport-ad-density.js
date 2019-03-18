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
const {boxViewableArea} = require('../utils/geometry');

/** @inheritDoc */
class ViewportAdDensity extends Audit {
  /**
   * @return {AuditMetadata}
   * @override
   */
  static get meta() {
    return {
      id: 'viewport-ad-density',
      title: 'Ad density inside viewport is within recommended range',
      failureTitle: 'Ad density inside viewport is higher than recommended',
      description: 'The ads-to-content ratio inside the viewport can have ' +
          'an impact on user experience and ultimately user retention. The ' +
          'Better Ads Standard [recommends having an ad density below 30%]' +
          '(https://www.betterads.org/mobile-ad-density-higher-than-30/). ' +
          '[Learn more.]' +
          '(https://ad-speed-insights.appspot.com/#ad-density)',
      requiredArtifacts: ['ViewportDimensions', 'RenderedAdSlots'],
    };
  }

  /**
   * @override
   * @param {Artifacts} artifacts
   * @return {LH.Audit.Product}
   */
  static audit(artifacts) {
    const viewport = artifacts.ViewportDimensions;
    const slots = artifacts.RenderedAdSlots;

    if (!slots.length) {
      return auditNotApplicable('No slots on page');
    }
    // Checks that non-null (visible) slots exist in array.
    if (!slots.find((s) => s != null)) {
      return auditNotApplicable('No visible slots on page');
    }

    const adArea = slots.reduce((sum, slot) =>
      sum + boxViewableArea(slot, viewport), 0);
    // NOTE(gmatute): consider using content width instead of viewport
    const viewArea = viewport.innerWidth * viewport.innerHeight;

    if (viewArea <= 0) {
      throw new Error('Viewport area is zero');
    }
    if (adArea > viewArea) {
      throw new Error('Calculated ad area is larger than viewport');
    }
    const score = adArea / viewArea > 0.3 ? 0 : 1;
    return {
      score,
      rawValue: adArea / viewArea,
      // No displayValue if passing, no changes to be made.
      displayValue: score ? ''
        : `${Math.floor(100 * adArea / viewArea)}% covered by ads`,
    };
  }
}

module.exports = ViewportAdDensity;
