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
        ' to load is decreased  and the ad is more likely to be viewed.',
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
        .filter((slot) => slot && slot.width > 1 && slot.height > 1);
    const slotMidpoints = slots.map((slot) =>
      slot ? slot.content[1] + slot.height / 2 : Infinity);
    const topSlotMidpoint = Math.min(...slotMidpoints);

    const inViewport = topSlotMidpoint < viewport.innerHeight;

    if (!inViewport) {
      return auditNotApplicable('No ads in viewport.');
    }

    return {
      score: inViewport && topSlotMidpoint < 200 ? 0 : 1,
      rawValue: topSlotMidpoint,
      displayValue: 'A scroll of ' + Math.round(topSlotMidpoint)
        + ' px would hide half of your topmost ad',
    };
  }
}

module.exports = AdTopOfViewport;
