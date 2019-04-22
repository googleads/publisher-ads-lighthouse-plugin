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

const util = require('util');
const {auditNotApplicable} = require('../utils/builder');
const {AUDITS, NOT_APPLICABLE} = require('../messages/messages.js');
const {Audit} = require('lighthouse');
const {isBoxInViewport} = require('../utils/geometry');
const {isGPTIFrame} = require('../utils/resource-classification');

const id = 'ads-in-viewport';
const {
  title,
  failureTitle,
  description,
  displayValue,
  failureDisplayValue,
} = AUDITS[id];

/**
 * Table headings for audits details sections.
 * @type {LH.Audit.Details.Table['headings']}
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
      id,
      title,
      failureTitle,
      description,
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
        .filter((iframe) => isGPTIFrame(iframe));

    if (!slots.length) {
      return auditNotApplicable(NOT_APPLICABLE.NO_VISIBLE_SLOTS);
    }

    /** @type {Array<{slot: string}>} */
    const nonvisible = slots
        .filter((slot) => !isBoxInViewport(slot.clientRect, viewport))
        .map((slot) => ({slot: slot.id}))
        .sort((a, b) => a.slot.localeCompare(b.slot));

    const visibleCount = slots.length - nonvisible.length;
    const pluralEnding = nonvisible.length == 1 ? '' : 's';

    return {
      rawValue: visibleCount / slots.length,
      score: nonvisible.length > 3 ? 0 : 1,
      displayValue: nonvisible.length ?
        util.format(failureDisplayValue, nonvisible.length, pluralEnding) :
        displayValue,
      details: AdsInViewport.makeTableDetails(HEADINGS, nonvisible),
    };
  }
}

module.exports = AdsInViewport;
