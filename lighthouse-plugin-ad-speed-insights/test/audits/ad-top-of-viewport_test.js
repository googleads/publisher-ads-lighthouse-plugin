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

const AdTopOfViewport = require('../../audits/ad-top-of-viewport');
const {expect} = require('chai');

describe('AdTopOfViewport', () => {
  // From top left corner & dimensions
  const generateSlot = ({x = 0, y, w = 200, h}) => ({
    boxModel: {
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
    innerHeight: 500,
    innerWidth: 300,
  };

  describe('rawValue', () => {
    it('should succeed if there are no ad slots', async () => {
      const IframeElements = [];

      const artifacts = {IframeElements, ViewportDimensions};
      expect(AdTopOfViewport.audit(artifacts)).to.have.property('rawValue', true);
    });

    it('should return midpoint of top ad within viewport', async () => {
      const IframeElements = [
        generateSlot({y: 100, h: 50}), // in
        generateSlot({y: 200, h: 50}), // out
        generateSlot({y: 800, h: 50}), // out
        generateSlot({x: 0, y: 0, w: 0, h: 0}), // hidden
      ];

      const artifacts = {IframeElements, ViewportDimensions};
      expect(AdTopOfViewport.audit(artifacts)).to.have.property('rawValue', 125);
    });

    it('should not be applicable if no ads in viewport', async () => {
      const IframeElements = [
        generateSlot({y: 505, h: 50}), // out
        generateSlot({y: 600, h: 50}), // out
        generateSlot({y: 800, h: 50}), // out
        generateSlot({x: 0, y: 0, w: 0, h: 0}), // hidden
      ];

      const artifacts = {IframeElements, ViewportDimensions};
      expect(AdTopOfViewport.audit(artifacts))
          .to.have.property('notApplicable', true);
    });

    it('should not be applicable if no slots are rendered', async () => {
      const IframeElements = [];

      const artifacts = {IframeElements, ViewportDimensions};
      expect(AdTopOfViewport.audit(artifacts))
          .to.have.property('notApplicable', true);
    });

    it('should not be applicable if no slots are visible', async () => {
      const IframeElements = [
        generateSlot({x: 0, y: 0, w: 0, h: 0}), // hidden
        generateSlot({x: 0, y: 0, w: 0, h: 0}), // hidden
      ];

      const artifacts = {IframeElements, ViewportDimensions};
      expect(AdTopOfViewport.audit(artifacts))
          .to.have.property('notApplicable', true);
    });
  });
});
