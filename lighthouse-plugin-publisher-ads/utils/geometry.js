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

/** @typedef {Omit<ClientRect, 'x'|'y'|'toJSON'>} Rect */

/**
 * @param {Rect} clientRect
 * @param {LH.Artifacts.ViewportDimensions} viewport
 * @return {boolean}
 */
function isBoxInViewport(clientRect, viewport) {
  const {innerWidth, innerHeight} = viewport;
  const {left, top, right, bottom} = clientRect;

  return left < right && top < bottom && // Non-zero area
    left < innerWidth && top < innerHeight && 0 < right && 0 < bottom;
}

/**
 * @param {Rect} clientRect
 * @param {LH.Artifacts.ViewportDimensions} viewport
 * @return {number}
 */
function boxViewableArea(clientRect, viewport) {
  if (!isBoxInViewport(clientRect, viewport)) return 0;

  const {innerWidth, innerHeight} = viewport;
  const {left, top, right, bottom} = clientRect;

  return (Math.min(right, innerWidth) - Math.max(left, 0)) *
    (Math.min(bottom, innerHeight) - Math.max(top, 0));
}

/**
 * Converts points (from a TraceEvent) to a Rect.
 * @param {number[]} points
 * @return {Rect}
 */
function toClientRect([left, top, width, height]) {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  };
}

/**
 * Checks Rect a overlaps Rect b. Note that this returns true for
 * overlapping perimeters.
 * @param {Rect} a
 * @param {Rect} b
 * @return {boolean}
 */
function overlaps(a, b) {
  const overlapX = !(a.right < b.left || b.right < a.left);
  const overlapY = !(a.bottom < b.top || b.bottom < a.top);
  return overlapX && overlapY;
}

export {
  boxViewableArea,
  isBoxInViewport,
  overlaps,
  toClientRect,
};
