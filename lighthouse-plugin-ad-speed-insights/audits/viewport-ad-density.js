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
const {AUDITS, ERRORS, NOT_APPLICABLE} = require('../messages/messages.js');
const {Audit} = require('lighthouse');
const {boxViewableArea} = require('../utils/geometry');
const {isGPTIFrame} = require('../utils/resource-classification');

const id = 'viewport-ad-density';
const {
  title,
  failureTitle,
  description,
  displayValue,
  failureDisplayValue,
} = AUDITS[id];

/** @inheritDoc */
class ViewportAdDensity extends Audit {
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
   * @override
   * @param {Artifacts} artifacts
   * @return {LH.Audit.Product}
   */
  static audit(artifacts) {
    const viewport = artifacts.ViewportDimensions;
    const slots = artifacts.IFrameElements.filter(
      (slot) => isGPTIFrame(slot));

    if (!slots.length) {
      return auditNotApplicable(NOT_APPLICABLE.NO_VISIBLE_SLOTS);
    }

    const adArea = slots.reduce((sum, slot) =>
      sum + boxViewableArea(slot.clientRect, viewport), 0);

    const viewArea = viewport.innerWidth * viewport.innerHeight;

    if (viewArea <= 0) {
      throw new Error(ERRORS.VIEWPORT_AREA_ZERO);
    }
    if (adArea > viewArea) {
      throw new Error(ERRORS.AREA_LARGER_THAN_VIEWPORT);
    }
    const score = adArea / viewArea > 0.3 ? 0 : 1;
    return {
      score,
      numericValue: adArea / viewArea,
      // No displayValue if passing, no changes to be made.
      displayValue: score ?
        displayValue :
        util.format(failureDisplayValue, Math.floor(100 * adArea / viewArea)),
    };
  }
}

module.exports = ViewportAdDensity;
