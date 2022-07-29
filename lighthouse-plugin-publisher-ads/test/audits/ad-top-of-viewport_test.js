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

import AdTopOfViewport from '../../audits/ad-top-of-viewport.js';

import chai from 'chai';

const {expect} = chai;

describe('AdTopOfViewport', () => {
  // From top left corner & dimensions
  const generateSlot = ({left = 0, top, w = 200, h}) => ({
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
    innerHeight: 500,
    innerWidth: 300,
  };

  describe('score', () => {
    it('should succeed if there are no ad slots', async () => {
      const IFrameElements = [];

      const artifacts = {IFrameElements, ViewportDimensions};
      expect(AdTopOfViewport.audit(artifacts)).to.have.property('score', 1);
    });

    it('should return midpoint of top ad within viewport', async () => {
      const IFrameElements = [
        generateSlot({top: 100, h: 50}), // in
        generateSlot({top: 200, h: 50}), // out
        generateSlot({top: 800, h: 50}), // out
        generateSlot({left: 0, top: 0, w: 0, h: 0}), // hidden
      ];

      const artifacts = {IFrameElements, ViewportDimensions};
      expect(AdTopOfViewport.audit(artifacts)).to.have.property('numericValue', 125);
    });

    it('should not be applicable if no ads in viewport', async () => {
      const IFrameElements = [
        generateSlot({top: 505, h: 50}), // out
        generateSlot({top: 600, h: 50}), // out
        generateSlot({top: 800, h: 50}), // out
        generateSlot({left: 0, top: 0, w: 0, h: 0}), // hidden
      ];

      const artifacts = {IFrameElements, ViewportDimensions};
      expect(AdTopOfViewport.audit(artifacts))
          .to.have.property('notApplicable', true);
    });

    it('should not be applicable if no slots are rendered', async () => {
      const IFrameElements = [];

      const artifacts = {IFrameElements, ViewportDimensions};
      expect(AdTopOfViewport.audit(artifacts))
          .to.have.property('notApplicable', true);
    });

    it('should not be applicable if no slots are visible', async () => {
      const IFrameElements = [
        generateSlot({left: 0, top: 0, w: 0, h: 0}), // hidden
        generateSlot({left: 0, top: 0, w: 0, h: 0}), // hidden
      ];

      const artifacts = {IFrameElements, ViewportDimensions};
      expect(AdTopOfViewport.audit(artifacts))
          .to.have.property('notApplicable', true);
    });
  });
});
