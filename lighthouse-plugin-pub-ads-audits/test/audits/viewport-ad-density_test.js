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

const ViewportAdDensity = require('../../audits/viewport-ad-density');
const {expect} = require('chai');

describe('ViewportAdDensity', () => {
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

  const ViewportDimensions = {
    innerHeight: 200,
    innerWidth: 300,
  };

  describe('numericValue', () => {
    it('should not be applicable if there are no ad slots', async () => {
      const IFrameElements = [];

      const artifacts = {IFrameElements, ViewportDimensions};
      const result = ViewportAdDensity.audit(artifacts);
      expect(result).to.have.property('notApplicable', true);
    });

    it('should return ad density inside viewport', async () => {
      const IFrameElements = [
        generateSlot({x: 0, y: 100, w: 50, h: 50}), // in
        generateSlot({x: 100, y: 0, w: 50, h: 50}), // in
        generateSlot({x: 0, y: 200, w: 50, h: 50}), // out
        generateSlot({x: 0, y: 0, w: 0, h: 0}), // hidden
        generateSlot({x: 0, y: 0, w: 0, h: 0}), // hidden
      ];

      const artifacts = {IFrameElements, ViewportDimensions};
      const result = ViewportAdDensity.audit(artifacts);
      expect(result).to.have.property('numericValue', 50 / 600);
    });

    it('should throw error if ad area exceeds viewport area', async () => {
      const IFrameElements = [
        generateSlot({x: 0, y: 0, w: 1000, h: 400}),
        generateSlot({x: 0, y: 0, w: 600, h: 700}),
      ];

      const artifacts = {IFrameElements, ViewportDimensions};
      expect(() => ViewportAdDensity.audit(artifacts)).to.throw();
    });

    it('should throw error if viewport area is zero', async () => {
      const IFrameElements = [
        generateSlot({x: 0, y: 0, w: 1000, h: 400}),
      ];
      const ViewportDimensions = {innerHeight: 0, innerWidth: 0};
      const artifacts = {IFrameElements, ViewportDimensions};
      expect(() => ViewportAdDensity.audit(artifacts)).to.throw();
    });

    const positiveTests = [
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

    positiveTests.forEach(async (test) =>
      it(`should handle slots on the ${test.pos} properly`, () => {
        const IFrameElements = [generateSlot(test)];
        const artifacts = {IFrameElements, ViewportDimensions};
        const result = ViewportAdDensity.audit(artifacts);
        expect(result).to.have.property('numericValue', test.overlap / 60000);
      })
    );

    const negativeTests = [
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

    negativeTests.forEach(async (test) =>
      it(`should return zero for slots outside the ${test.pos}`, () => {
        const IFrameElements = [generateSlot(test)];
        const artifacts = {IFrameElements, ViewportDimensions};
        const result = ViewportAdDensity.audit(artifacts);
        expect(result).to.have.property('numericValue', 0);
      })
    );

    it('should be not applicable if no slot has area', async () => {
      const IFrameElements = [generateSlot({x: 10, y: 10, w: 0, h: 0})];
      const artifacts = {IFrameElements, ViewportDimensions};
      const result = ViewportAdDensity.audit(artifacts);
      expect(result).to.have.property('notApplicable', true);
    });

    it('should not be applicable if all slots are hidden', async () => {
      const IFrameElements = [
        generateSlot({x: 0, y: 0, w: 0, h: 0}), // hidden
        generateSlot({x: 0, y: 0, w: 0, h: 0}), // hidden
      ];
      const artifacts = {IFrameElements, ViewportDimensions};
      const result = ViewportAdDensity.audit(artifacts);
      expect(result).to.have.property('notApplicable', true);
    });
  });
});
