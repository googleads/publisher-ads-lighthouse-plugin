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

const assert = require('assert');

/**
 * @param {?LH.Crdp.DOM.BoxModel} boxModel
 * @param {LH.Artifacts.ViewportDimensions} viewport
 * @return {boolean}
 */
function isBoxInViewport(boxModel, viewport) {
  if (!boxModel) return false;

  const {innerWidth, innerHeight} = viewport;
  const [left, top, right, _t, _r, bottom, _l, _b] = boxModel.content;
  assert(left == _l && top == _t && right == _r && bottom == _b);

  return left < right && top < bottom && // Non-zero area
    left < innerWidth && top < innerHeight && 0 < right && 0 < bottom;
}

/**
 * @param {?LH.Crdp.DOM.BoxModel} box
 * @param {LH.Artifacts.ViewportDimensions} viewport
 * @return {number}
 */
function boxViewableArea(box, viewport) {
  if (!box || !isBoxInViewport(box, viewport)) return 0;

  const {innerWidth, innerHeight} = viewport;
  const [left, top, right, _t, _r, bottom, _l, _b] = box.content;
  assert(left == _l && top == _t && right == _r && bottom == _b);

  return (Math.min(right, innerWidth) - Math.max(left, 0)) *
    (Math.min(bottom, innerHeight) - Math.max(top, 0));
}

module.exports = {
  isBoxInViewport,
  boxViewableArea,
};

