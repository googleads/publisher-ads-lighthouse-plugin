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
const {AUDITS, NOT_APPLICABLE} = require('../messages/en-US.js');
const {Audit} = require('lighthouse');
const {isGPTIFrame} = require('../utils/resource-classification');


/**
 * Table headings for audits details sections.
 * @type {LH.Audit.Details.Table['headings']}
 */
const HEADINGS = [
  {key: 'slot', itemType: 'text', text: 'Top Slot ID'},
];


/** @inheritDoc */
class AdTopOfViewport extends Audit {
  /**
   * @return {AuditMetadata}
   * @override
   */
  static get meta() {
    const id = 'ad-top-of-viewport';
    const {title, failureTitle, description} = AUDITS[id];
    return {
      id,
      title,
      failureTitle,
      description,
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
    const slots = artifacts.IFrameElements.filter((slot) => isGPTIFrame(slot))
        .map((slot) => ({
          midpoint: slot.clientRect.top + slot.clientRect.height / 2,
          id: slot.id,
        }));

    if (!slots.length) {
      return auditNotApplicable(NOT_APPLICABLE.NO_SLOTS);
    }

    const topSlot = slots.reduce((a, b) => (a.midpoint < b.midpoint) ? a : b);

    const inViewport = topSlot.midpoint < viewport.innerHeight;

    if (!inViewport) {
      return auditNotApplicable(NOT_APPLICABLE.NO_ADS_VP);
    }

    const score = inViewport && topSlot.midpoint < 200 ? 0 : 1;

    return {
      score,
      rawValue: topSlot.midpoint,
      // No displayValue if passing, no changes to be made.
      displayValue: score ? '' : 'A scroll of ' + Math.round(topSlot.midpoint)
        + ' px would hide half of your topmost ad.',
      details: AdTopOfViewport.makeTableDetails(
        HEADINGS,
        score ? [] : [{slot: topSlot.id}]
      ),
    };
  }
}

module.exports = AdTopOfViewport;
