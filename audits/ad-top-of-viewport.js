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

/** @inheritDoc */
class AdTopOfViewport extends Audit {
  /**
   * @return {AuditMetadata}
   * @override
   */
  static get meta() {
    return {
      id: 'ad-top-of-viewport',
      title: 'Ads are below top of viewport',
      failureTitle: 'Top ad is too high in viewport',
      description: 'Over 10% of ads are never viewed due to the user scrolling' +
        ' past before the ad is visible. By moving ads away from the very top' +
        ' of the viewport, the likelihood of the ad being scrolled past prior' +
        ' to load is decreased  and the ad is more likely to be viewed. ' +
        '[Learn more.]' +
        '(https://ad-speed-insights.appspot.com/#top-of-viewport)',
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
    const slots = artifacts.RenderedAdSlots
        .filter((slot) => slot && slot.width > 1 && slot.height > 1)
        .map((slot) =>
          ({midpoint: slot.content[1] + slot.height / 2, id: slot.id}));

    if (!slots.length) {
      return auditNotApplicable('No visible slots.');
    }

    const topSlot = slots.reduce((a, b) => (a.midpoint < b.midpoint) ? a : b);

    const inViewport = topSlot.midpoint < viewport.innerHeight;

    if (!inViewport) {
      return auditNotApplicable('No ads in viewport.');
    }

    const score = inViewport && topSlot.midpoint < 200 ? 0 : 1;

    return {
      score,
      rawValue: topSlot.midpoint,
      // No displayValue if passing, no changes to be made.
      displayValue: score ? '' : 'A scroll of ' + Math.round(topSlot.midpoint)
        + ' px would hide half of your topmost ad (slot: ' + topSlot.id + ')',
    };
  }
}

module.exports = AdTopOfViewport;
