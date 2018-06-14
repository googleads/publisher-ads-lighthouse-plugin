const AdsInViewport = require('../../audits/ads-in-viewport');
const {expect} = require('chai');

describe('AdsInViewport', () => {
  // Quad from top left corner (x, y) and dimensions (w, h)
  const generateQuad = ({x, y, w, h}) => [x, y, x+w, y, x+w, y+h, x, y+h];

  describe('rawValue', () => {
    const ViewportDimensions = {
      // Most desktops size
      innerWidth: 1000,
      innerHeight: 700,
    };

    it('should succeed if there are no ad slots', async () => {
      const RenderedAdSlots = [];

      const artifacts = {RenderedAdSlots, ViewportDimensions};
      expect(AdsInViewport.audit(artifacts)).to.have.property('rawValue', true);
    });

    it('should return zero if all ad slots are hidden', async () => {
      const RenderedAdSlots = [null, null, null];

      const artifacts = {RenderedAdSlots, ViewportDimensions};
      expect(AdsInViewport.audit(artifacts)).to.have.property('rawValue', 0);
    });

    it('should return fraction of ad slots inside viewport', async () => {
      const RenderedAdSlots = [
        {content: generateQuad({x: 0, y: 100, w: 50, h: 50})}, // in
        {content: generateQuad({x: 0, y: 700, w: 50, h: 50})}, // out
        {content: generateQuad({x: 0, y: 800, w: 50, h: 50})}, // out
        null, null, // hidden
      ];

      const artifacts = {RenderedAdSlots, ViewportDimensions};
      expect(AdsInViewport.audit(artifacts)).to.have.property('rawValue', 1/5);
    });

    it('should handle slots on an edge of the viewport as seen', async () => {
      const RenderedAdSlots = [
        {content: generateQuad({x: 10, y: -10, w: 900, h: 50})},
        {content: generateQuad({x: -10, y: 10, w: 50, h: 900})},
      ];

      const artifacts = {RenderedAdSlots, ViewportDimensions};
      expect(AdsInViewport.audit(artifacts)).to.have.property('rawValue', 1);
    });

    it('should handle slots on a corner of the viewport as seen', async () => {
      const RenderedAdSlots = [
        {content: generateQuad({x: -10, y: -10, w: 50, h: 50})},
        {content: generateQuad({x: 990, y: 690, w: 50, h: 50})},
      ];

      const artifacts = {RenderedAdSlots, ViewportDimensions};
      expect(AdsInViewport.audit(artifacts)).to.have.property('rawValue', 1);
    });

    it('should handle slots left of the viewport as unseen', async () => {
      const RenderedAdSlots = [
        {content: generateQuad({x: -10, y: 0, w: 10, h: 700})},
      ];

      const artifacts = {RenderedAdSlots, ViewportDimensions};
      expect(AdsInViewport.audit(artifacts)).to.have.property('rawValue', 0);
    });

    it('should handle slots above the viewport as unseen', async () => {
      const RenderedAdSlots = [
        {content: generateQuad({x: 0, y: -10, w: 1000, h: 10})},
      ];

      const artifacts = {RenderedAdSlots, ViewportDimensions};
      expect(AdsInViewport.audit(artifacts)).to.have.property('rawValue', 0);
    });

    it('should handle slots right of the viewport as unseen', async () => {
      const RenderedAdSlots = [
        {content: generateQuad({x: 1000, y: 0, w: 10, h: 700})},
      ];

      const artifacts = {RenderedAdSlots, ViewportDimensions};
      expect(AdsInViewport.audit(artifacts)).to.have.property('rawValue', 0);
    });

    it('should handle slots below the viewport as unseen', async () => {
      const RenderedAdSlots = [
        {content: generateQuad({x: 0, y: 700, w: 1000, h: 10})},
      ];

      const artifacts = {RenderedAdSlots, ViewportDimensions};
      expect(AdsInViewport.audit(artifacts)).to.have.property('rawValue', 0);
    });

    it('should handle slots with no area as unseen', async () => {
      const RenderedAdSlots = [
        {content: generateQuad({x: 10, y: 10, w: 0, h: 0})},
      ];

      const artifacts = {RenderedAdSlots, ViewportDimensions};
      expect(AdsInViewport.audit(artifacts)).to.have.property('rawValue', 0);
    });
  });
});
