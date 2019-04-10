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

const geometry = require('../../utils/geometry');
const {expect} = require('chai');

describe('geometry', () => {
  // From top left corner & dimensions
  const generateSlot = ({x, y, w, h}) => ({
    clientRect: {
      x,
      y,
      width: w,
      height: h,
      top: y,
      bottom: y + h,
      left: x,
      right: x + w,
    },
    id: 'google_ads_iframe_test',
    isVisible: w > 0 && h > 0,
  });

  const viewport = {
    innerHeight: 200,
    innerWidth: 300,
  };

  describe('#isBoxInViewport', () => {
    const {isBoxInViewport} = geometry;

    describe('true', () => {
      const tests = [
        {x: 10, y: 10, w: 10, h: 10, pos: 'inside'},
        // Cases overlapping an edge of the viewport
        {x: -10, y: 0, w: 20, h: 200, pos: 'left edge'},
        {x: 0, y: -10, w: 300, h: 20, pos: 'top edge'},
        {x: 290, y: 0, w: 20, h: 200, pos: 'right edge'},
        {x: 0, y: 190, w: 300, h: 20, pos: 'bottom edge'},
        // Cases overlapping a corner of the viewport
        {x: -10, y: -10, w: 20, h: 20, pos: 'top left corner'},
        {x: 290, y: -10, w: 20, h: 20, pos: 'top right corner'},
        {x: -10, y: 190, w: 20, h: 20, pos: 'bottom left corner'},
        {x: 290, y: 190, w: 20, h: 20, pos: 'bottom right corner'},
      ];

      tests.forEach(async (test) =>
        it(`should handle slots on the ${test.pos} as seen`, () => {
          expect(isBoxInViewport(generateSlot(test).clientRect, viewport))
              .to.equal(true);
        })
      );
    });

    describe('false', () => {
      const tests = [
        // Cases outside an edge of the viewport
        {x: -20, y: 0, w: 20, h: 200, pos: 'left edge'},
        {x: 0, y: -20, w: 300, h: 20, pos: 'top edge'},
        {x: 300, y: 0, w: 20, h: 200, pos: 'right edge'},
        {x: 0, y: 200, w: 300, h: 20, pos: 'bottom edge'},
        // Cases outside a corner of the viewport
        {x: -20, y: -20, w: 20, h: 20, pos: 'top left corner'},
        {x: 300, y: -20, w: 20, h: 20, pos: 'top right corner'},
        {x: -20, y: 200, w: 20, h: 20, pos: 'bottom left corner'},
        {x: 300, y: 200, w: 20, h: 20, pos: 'bottom right corner'},
      ];

      tests.forEach(async (test) =>
        it(`should handle slots outside the ${test.pos} as not seen`, () => {
          expect(isBoxInViewport(generateSlot(test).clientRect, viewport))
              .to.equal(false);
        })
      );

      it('should return false if slot has no area', async () => {
        const slot = generateSlot({x: 10, y: 10, w: 0, h: 0});
        expect(isBoxInViewport(slot.clientRect, viewport)).to.equal(false);
      });

      it('should return false if slot is hidden', async () => {
        const slot = generateSlot({x: 0, y: 0, w: 0, h: 0}); // hidden
        expect(isBoxInViewport(slot.clientRect, viewport)).to.equal(false);
      });
    });
  });

  describe('#boxViewableArea', () => {
    const {boxViewableArea} = geometry;

    describe('area', () => {
      const tests = [
        {x: 10, y: 10, w: 10, h: 10, overlap: 100, pos: 'inside'},
        // Cases overlapping an edge of the viewport
        {x: -10, y: 0, w: 20, h: 200, overlap: 2000, pos: 'left edge'},
        {x: 0, y: -10, w: 300, h: 20, overlap: 3000, pos: 'top edge'},
        {x: 290, y: 0, w: 20, h: 200, overlap: 2000, pos: 'right edge'},
        {x: 0, y: 190, w: 300, h: 20, overlap: 3000, pos: 'bottom edge'},
        // Cases overlapping a corner of the viewport
        {x: -10, y: -10, w: 20, h: 20, overlap: 100, pos: 'top left corner'},
        {x: 290, y: -10, w: 20, h: 20, overlap: 100, pos: 'top right corner'},
        {x: -10, y: 190, w: 20, h: 20, overlap: 100, pos: 'bottom left corner'},
        {x: 290, y: 190, w: 20, h: 20, overlap: 100, pos: 'bottom right corner'},
      ];

      tests.forEach(async (test) =>
        it(`should handle slots on the ${test.pos} properly`, () => {
          const result =
            boxViewableArea(generateSlot(test).clientRect, viewport);
          expect(result).to.equal(test.overlap);
        })
      );
    });

    describe('zero', () => {
      const tests = [
        // Cases outside an edge of the viewport
        {x: -20, y: 0, w: 20, h: 200, pos: 'left edge'},
        {x: 0, y: -20, w: 300, h: 20, pos: 'top edge'},
        {x: 300, y: 0, w: 20, h: 200, pos: 'right edge'},
        {x: 0, y: 200, w: 300, h: 20, pos: 'bottom edge'},
        // Cases outside a corner of the viewport
        {x: -20, y: -20, w: 20, h: 20, pos: 'top left corner'},
        {x: 300, y: -20, w: 20, h: 20, pos: 'top right corner'},
        {x: -20, y: 200, w: 20, h: 20, pos: 'bottom left corner'},
        {x: 300, y: 200, w: 20, h: 20, pos: 'bottom right corner'},
      ];

      tests.forEach(async (test) =>
        it(`should return zero for slots outside the ${test.pos}`, () => {
          expect(boxViewableArea(generateSlot(test).clientRect, viewport))
              .to.equal(0);
        })
      );

      it('should return zero if slot has no area', async () => {
        const slot = generateSlot({x: 10, y: 10, w: 0, h: 0});
        expect(boxViewableArea(slot.clientRect, viewport)).to.equal(0);
      });

      it('should return zero if slot is hidden', async () => {
        const slot = generateSlot({x: 0, y: 0, w: 0, h: 0}); // hidden
        expect(boxViewableArea(slot.clientRect, viewport)).to.equal(0);
      });
    });
  });
});
