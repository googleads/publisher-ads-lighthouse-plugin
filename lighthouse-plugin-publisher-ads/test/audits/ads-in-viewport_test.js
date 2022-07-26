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

import AdsInViewport from '../../audits/ads-in-viewport.js';

import chai from 'chai';

const {expect} = chai;

describe('AdsInViewport', () => {
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
  });

  const ViewportDimensions = {
    innerHeight: 200,
    innerWidth: 300,
  };

  describe('score', () => {
    it('should succeed if there are no ad slots', async () => {
      const IFrameElements = [];

      const artifacts = {IFrameElements, ViewportDimensions};
      expect(AdsInViewport.audit(artifacts)).to.have.property('score', 1);
    });

    it('should return fraction of ad slots inside viewport', async () => {
      const IFrameElements = [
        generateSlot({left: 0, top: 100, w: 50, h: 50}), // in
        generateSlot({left: 0, top: 700, w: 50, h: 50}), // out
        generateSlot({left: 0, top: 800, w: 50, h: 50}), // out
        generateSlot({left: 0, top: 0, w: 0, h: 0}), // hidden
      ];

      const artifacts = {IFrameElements, ViewportDimensions};
      expect(AdsInViewport.audit(artifacts)).to.have.property('numericValue', 1 / 3);
    });

    const positiveTests = [
      {left: 10, top: 10, w: 10, h: 10, overlap: 100, pos: 'inside'},
      // Cases overlapping an edge of the viewport
      {left: -10, top: 0, w: 20, h: 200, overlap: 2000, pos: 'left edge'},
      {left: 0, top: -10, w: 300, h: 20, overlap: 3000, pos: 'top edge'},
      {left: 290, top: 0, w: 20, h: 200, overlap: 2000, pos: 'right edge'},
      {left: 0, top: 190, w: 300, h: 20, overlap: 3000, pos: 'bottom edge'},
      // Cases overlapping a corner of the viewport
      {left: -10, top: -10, w: 20, h: 20, overlap: 100, pos: 'top left corner'},
      {left: 290, top: -10, w: 20, h: 20, overlap: 100, pos: 'top right corner'},
      {left: -10, top: 190, w: 20, h: 20, overlap: 100, pos: 'bottom left corner'},
      {left: 290, top: 190, w: 20, h: 20, overlap: 100, pos: 'bottom right corner'},
    ];

    positiveTests.forEach(async (test) =>
      it(`should handle slots on the ${test.pos} properly`, () => {
        const IFrameElements = [generateSlot(test)];
        const artifacts = {IFrameElements, ViewportDimensions};
        expect(AdsInViewport.audit(artifacts)).to.have.property('numericValue', 1);
      }),
    );

    const negativeTests = [
      // Cases outside an edge of the viewport
      {left: -20, top: 0, w: 20, h: 200, pos: 'left edge'},
      {left: 0, top: -20, w: 300, h: 20, pos: 'top edge'},
      {left: 300, top: 0, w: 20, h: 200, pos: 'right edge'},
      {left: 0, top: 200, w: 300, h: 20, pos: 'bottom edge'},
      // Cases outside a corner of the viewport
      {left: -20, top: -20, w: 20, h: 20, pos: 'top left corner'},
      {left: 300, top: -20, w: 20, h: 20, pos: 'top right corner'},
      {left: -20, top: 200, w: 20, h: 20, pos: 'bottom left corner'},
      {left: 300, top: 200, w: 20, h: 20, pos: 'bottom right corner'},
    ];

    negativeTests.forEach(async (test) =>
      it(`should handle slots outside the ${test.pos}`, () => {
        const IFrameElements = [generateSlot(test)];
        const artifacts = {IFrameElements, ViewportDimensions};
        expect(AdsInViewport.audit(artifacts)).to.have.property('numericValue', 0);
      }),
    );

    it('should be not applicable if no slots have area', async () => {
      const IFrameElements = [
        generateSlot({left: 10, top: 10, w: 0, h: 0}),
        generateSlot({left: 100, top: 10, w: 100, h: 0}),
      ];
      const artifacts = {IFrameElements, ViewportDimensions};
      expect(AdsInViewport.audit(artifacts))
          .to.have.property('notApplicable', true);
    });

    it('should be not applicable if all slots are hidden', async () => {
      const IFrameElements = [
        generateSlot({left: 0, top: 0, w: 0, h: 0}), // hidden
        generateSlot({left: 0, top: 0, w: 0, h: 0}), // hidden
      ];
      const artifacts = {IFrameElements, ViewportDimensions};
      expect(AdsInViewport.audit(artifacts))
          .to.have.property('notApplicable', true);
    });
  });
});
