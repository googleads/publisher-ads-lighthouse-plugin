const AdTopOfViewport = require('../../audits/ad-top-of-viewport');
const {expect} = require('chai');

describe('AdTopOfViewport', () => {
  // From top left corner & dimensions
  const generateSlot = ({x = 0, y, w = 200, h}) =>
    ({content: [x, y, x + w, y, x + w, y + h, x, y + h],
      height: h,
      width: w,
    });

  const ViewportDimensions = {
    innerHeight: 500,
    innerWidth: 300,
  };

  describe('rawValue', () => {
    it('should succeed if there are no ad slots', async () => {
      const RenderedAdSlots = [];

      const artifacts = {RenderedAdSlots, ViewportDimensions};
      expect(AdTopOfViewport.audit(artifacts)).to.have.property('rawValue', true);
    });

    it('should return midpoint of top ad within viewport', async () => {
      const RenderedAdSlots = [
        generateSlot({y: 100, h: 50}), // in
        generateSlot({y: 200, h: 50}), // out
        generateSlot({y: 800, h: 50}), // out
        null, null, // hidden
      ];

      const artifacts = {RenderedAdSlots, ViewportDimensions};
      expect(AdTopOfViewport.audit(artifacts)).to.have.property('rawValue', 125);
    });

    it('should not be applicable if no ads in viewport', async () => {
      const RenderedAdSlots = [
        generateSlot({y: 505, h: 50}), // out
        generateSlot({y: 600, h: 50}), // out
        generateSlot({y: 800, h: 50}), // out
        null, null, // hidden
      ];

      const artifacts = {RenderedAdSlots, ViewportDimensions};
      expect(AdTopOfViewport.audit(artifacts))
          .to.have.property('notApplicable', true);
    });

    it('should not be applicable if no slots are rendered', async () => {
      const RenderedAdSlots = [];

      const artifacts = {RenderedAdSlots, ViewportDimensions};
      expect(AdTopOfViewport.audit(artifacts))
          .to.have.property('notApplicable', true);
    });

    it('should not be applicable if no slots are visible', async () => {
      const RenderedAdSlots = [null, null];

      const artifacts = {RenderedAdSlots, ViewportDimensions};
      expect(AdTopOfViewport.audit(artifacts))
          .to.have.property('notApplicable', true);
    });
  });
});
