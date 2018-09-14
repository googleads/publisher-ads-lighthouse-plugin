const ViewportAdDensity = require('../../audits/viewport-ad-density');
const {expect} = require('chai');

describe('ViewportAdDensity', () => {
  // From top left corner & dimensions
  const generateSlot = ({x, y, w, h}) =>
    ({content: [x, y, x + w, y, x + w, y + h, x, y + h]});

  const ViewportDimensions = {
    innerHeight: 200,
    innerWidth: 300,
  };

  describe('rawValue', () => {
    it('should not be applicable if there are no ad slots', async () => {
      const RenderedAdSlots = [];

      const artifacts = {RenderedAdSlots, ViewportDimensions};
      const result = ViewportAdDensity.audit(artifacts);
      expect(result).to.have.property('notApplicable', true);
    });

    it('should return ad density inside viewport', async () => {
      const RenderedAdSlots = [
        generateSlot({x: 0, y: 100, w: 50, h: 50}), // in
        generateSlot({x: 100, y: 0, w: 50, h: 50}), // in
        generateSlot({x: 0, y: 200, w: 50, h: 50}), // out
        null, null, // hidden
      ];

      const artifacts = {RenderedAdSlots, ViewportDimensions};
      const result = ViewportAdDensity.audit(artifacts);
      expect(result).to.have.property('rawValue', 50 / 600);
    });

    it('should handle overlapping ads without exceeding one', async () => {
      const RenderedAdSlots = [
        generateSlot({x: 0, y: 0, w: 1000, h: 400}),
        generateSlot({x: 0, y: 0, w: 600, h: 700}),
      ];

      const artifacts = {RenderedAdSlots, ViewportDimensions};
      const result = ViewportAdDensity.audit(artifacts);
      expect(result).to.have.property('rawValue', 1);
    });

    it('should throw error if viewport area is zero', async () => {
      const RenderedAdSlots = [
        generateSlot({x: 0, y: 0, w: 1000, h: 400}),
      ];
      const ViewportDimensions = {innerHeight: 0, innerWidth: 0};
      const artifacts = {RenderedAdSlots, ViewportDimensions};
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
        const RenderedAdSlots = [generateSlot(test)];
        const artifacts = {RenderedAdSlots, ViewportDimensions};
        const result = ViewportAdDensity.audit(artifacts);
        expect(result).to.have.property('rawValue', test.overlap / 60000);
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
        const RenderedAdSlots = [generateSlot(test)];
        const artifacts = {RenderedAdSlots, ViewportDimensions};
        const result = ViewportAdDensity.audit(artifacts);
        expect(result).to.have.property('rawValue', 0);
      })
    );

    it('should return zero if slot has no area', async () => {
      const RenderedAdSlots = [generateSlot({x: 10, y: 10, w: 0, h: 0})];
      const artifacts = {RenderedAdSlots, ViewportDimensions};
      const result = ViewportAdDensity.audit(artifacts);
      expect(result).to.have.property('rawValue', 0);
    });

    it('should not be applicable if all slots are hidden', async () => {
      const RenderedAdSlots = [null, null]; // no box model if slot is hidden
      const artifacts = {RenderedAdSlots, ViewportDimensions};
      const result = ViewportAdDensity.audit(artifacts);
      expect(result).to.have.property('notApplicable', true);
    });
  });
});
