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

import * as geometry from '../../utils/geometry.js';

import chai from 'chai';

const {expect} = chai;

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
        }),
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
        }),
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
          const result = boxViewableArea(
            generateSlot(test).clientRect, viewport);
          expect(result).to.equal(test.overlap);
        }),
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
        }),
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

  describe('toClientRect', () => {
    it('should build a correct rect', () => {
      const points = [100, 1000, 300, 250];
      const expectedRect = {
        left: 100,
        right: 400,
        top: 1000,
        bottom: 1250,
        width: 300,
        height: 250,
      };
      expect(geometry.toClientRect(points)).to.deep.equal(expectedRect);
    });
  });

  describe('overlaps', () => {
    it('should pass on nested rectangles', () => {
      const inner =
        {top: 20, bottom: 40, height: 20, left: 20, right: 40, width: 20};
      const outer =
        {top: 0, bottom: 100, height: 100, left: 0, right: 100, width: 20};
      expect(geometry.overlaps(inner, outer)).to.equal(true);
      expect(geometry.overlaps(outer, inner)).to.equal(true);
    });

    it('should pass on equal rectangles', () => {
      const rect =
        {top: 20, bottom: 40, height: 20, left: 20, right: 40, width: 20};
      expect(geometry.overlaps(rect, rect)).to.equal(true);
    });

    it('should pass on rectangles with overlapping horizontal edge', () => {
      const top =
        {top: 20, bottom: 40, height: 20, left: 20, right: 40, width: 20};
      const bottom =
        {top: 40, bottom: 60, height: 20, left: 30, right: 35, width: 5};
      expect(geometry.overlaps(top, bottom)).to.equal(true);
      expect(geometry.overlaps(bottom, top)).to.equal(true);
    });

    it('should pass on rectangles with overlapping vertical edge', () => {
      const left =
        {top: 30, bottom: 35, height: 5, left: 0, right: 20, width: 20};
      const right =
        {top: 20, bottom: 40, height: 20, left: 20, right: 40, width: 20};
      expect(geometry.overlaps(left, right)).to.equal(true);
      expect(geometry.overlaps(right, left)).to.equal(true);
    });

    it('should pass when overlaps', () => {
      const a =
        {top: 20, bottom: 40, height: 20, left: 20, right: 40, width: 20};
      const b =
        {top: 30, bottom: 50, height: 20, left: 30, right: 50, width: 20};
      expect(geometry.overlaps(a, b)).to.equal(true);
      expect(geometry.overlaps(a, b)).to.equal(true);
    });

    it('should fail on mismatching horizontal dimensions', () => {
      const top =
        {top: 20, bottom: 40, height: 20, left: 20, right: 40, width: 20};
      const bottom =
        {top: 50, bottom: 70, height: 20, left: 30, right: 35, width: 5};
      expect(geometry.overlaps(top, bottom)).to.equal(false);
      expect(geometry.overlaps(bottom, top)).to.equal(false);
    });

    it('should fail on mismatching vertical dimensions', () => {
      const left =
        {top: 30, bottom: 35, height: 5, left: 0, right: 20, width: 20};
      const right =
        {top: 20, bottom: 40, height: 20, left: 30, right: 50, width: 20};
      expect(geometry.overlaps(left, right)).to.equal(false);
      expect(geometry.overlaps(right, left)).to.equal(false);
    });
  });
});
