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

import ViewportAdDensity from '../../audits/viewport-ad-density.js';

import chai from 'chai';

const {expect} = chai;

describe('ViewportAdDensity', () => {
  // From top left corner & dimensions
  const generateSlot = ({left, top, w, h}) => ({
    clientRect: {
      width: w,
      height: h,
      top,
      bottom: top + h,
      left,
      right: left + w,
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

    it('should return ad density along a vertical axis', async () => {
      const IFrameElements = [
        generateSlot({left: 0, top: 100, w: 50, h: 50}), // in
        generateSlot({left: 25, top: 50, w: 50, h: 50}), // in
        generateSlot({left: 100, top: 0, w: 50, h: 50}), // in
        generateSlot({left: 0, top: 200, w: 50, h: 50}), // out
        generateSlot({left: 0, top: 0, w: 0, h: 0}), // hidden
        generateSlot({left: 0, top: 0, w: 0, h: 0}), // hidden
      ];

      const artifacts = {IFrameElements, ViewportDimensions};
      const result = ViewportAdDensity.audit(artifacts);
      expect(result).to.have.property('numericValue', 150 / 425);
    });

    it('should de-dupe overlapping ads', async () => {
      const IFrameElements = [
        generateSlot({left: 0, top: 0, w: 1000, h: 100}),
        generateSlot({left: 0, top: 25, w: 600, h: 50}),
      ];

      const artifacts = {IFrameElements, ViewportDimensions};
      const result = ViewportAdDensity.audit(artifacts);
      expect(result).to.have.property('numericValue', 100 / 250);
    });

    it('should de-dupe overlapping ads when unsorted', async () => {
      const IFrameElements = [
        generateSlot({left: 0, top: 0, w: 1000, h: 100}),
        generateSlot({left: 0, top: 25, w: 600, h: 50}),
      ];

      const artifacts = {IFrameElements, ViewportDimensions};
      const result = ViewportAdDensity.audit(artifacts);
      expect(result).to.have.property('numericValue', 100 / 250);
    });

    it('should clamp values at 100% density', async () => {
      const IFrameElements = [
        generateSlot({left: 0, top: 0, w: 1000, h: 400}),
        generateSlot({left: 0, top: 0, w: 600, h: 700}),
      ];

      const artifacts = {IFrameElements, ViewportDimensions};
      const result = ViewportAdDensity.audit(artifacts);
      expect(result).to.have.property('numericValue', 1);
    });

    it('should throw error if viewport area is zero', async () => {
      const IFrameElements = [
        generateSlot({left: 0, top: 0, w: 1000, h: 400}),
      ];
      const ViewportDimensions = {innerHeight: 0, innerWidth: 0};
      const artifacts = {IFrameElements, ViewportDimensions};
      expect(() => ViewportAdDensity.audit(artifacts)).to.throw();
    });

    const positiveTests = [
      {left: 10, top: 10, w: 10, h: 10, density: 10 / 215, pos: 'inside'},
      // Cases overlapping an edge of the viewport
      {left: -10, top: 0, w: 20, h: 200, density: 2 / 3, pos: 'left edge'},
      {left: 0, top: -10, w: 300, h: 20, density: 10 / 200, pos: 'top edge'},
      {left: 290, top: 0, w: 20, h: 200, density: 2 / 3, pos: 'right edge'},
      {left: 0, top: 190, w: 300, h: 20, density: 1 / 20, pos: 'bottom edge'},
      // Cases overlapping a corner of the viewport
      {left: -10, top: -10, w: 20, h: 20, density: 0.05, pos: 'top left corner'},
      {left: 290, top: -10, w: 20, h: 20, density: 0.05, pos: 'top right corner'},
      {left: -10, top: 190, w: 20, h: 20, density: 0.05, pos: 'bottom left corner'},
      {left: 290, top: 190, w: 20, h: 20, density: 0.05, pos: 'bottom right corner'},
    ];

    positiveTests.forEach(async (test) =>
      it(`should handle slots on the ${test.pos} properly`, () => {
        const IFrameElements = [generateSlot(test)];
        const artifacts = {IFrameElements, ViewportDimensions};
        const result = ViewportAdDensity.audit(artifacts);
        expect(result).to.have.property('numericValue', test.density);
      }),
    );

    const negativeTests = [
      // Cases outside an edge of the viewport
      {left: -20, top: 0, w: 20, h: 200, pos: 'left edge'},
      {left: 0, top: -20, w: 300, h: 20, pos: 'top edge'},
      {left: 300, top: 0, w: 20, h: 200, pos: 'right edge'},
      // Cases outside a corner of the viewport
      {left: -20, top: -20, w: 20, h: 20, pos: 'top left corner'},
      {left: 300, top: -20, w: 20, h: 20, pos: 'top right corner'},
      {left: -20, top: 200, w: 20, h: 20, pos: 'bottom left corner'},
      {left: 300, top: 200, w: 20, h: 20, pos: 'bottom right corner'},
    ];

    negativeTests.forEach(async (test) =>
      it(`should return zero for slots outside the ${test.pos}`, () => {
        const IFrameElements = [generateSlot(test)];
        const artifacts = {IFrameElements, ViewportDimensions};
        const result = ViewportAdDensity.audit(artifacts);
        expect(result).to.have.property('numericValue', 0);
      }),
    );

    it('should be not applicable if no slot has area', async () => {
      const IFrameElements = [generateSlot({left: 10, top: 10, w: 0, h: 0})];
      const artifacts = {IFrameElements, ViewportDimensions};
      const result = ViewportAdDensity.audit(artifacts);
      expect(result).to.have.property('notApplicable', true);
    });

    it('should not be applicable if all slots are hidden', async () => {
      const IFrameElements = [
        generateSlot({left: 0, top: 0, w: 0, h: 0}), // hidden
        generateSlot({left: 0, top: 0, w: 0, h: 0}), // hidden
      ];
      const artifacts = {IFrameElements, ViewportDimensions};
      const result = ViewportAdDensity.audit(artifacts);
      expect(result).to.have.property('notApplicable', true);
    });
  });
});
