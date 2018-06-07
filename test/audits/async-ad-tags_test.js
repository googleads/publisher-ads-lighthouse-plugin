const AsyncAdTags = require('../../audits/async-ad-tags');
const {expect} = require('chai');

describe('AsyncAdTags', () => {
  describe('rawValue', () => {
    it('should succeed if there are no ad tags', async () => {
      const StaticAdTags = [];

      const {rawValue} = AsyncAdTags.audit({StaticAdTags});
      expect(rawValue).to.equal(true);
    });

    it('should succeed if all ad tags are async', async () => {
      const StaticAdTags = [
        {attributes: ['async']},
        {attributes: ['async']},
        {attributes: ['async']},
      ];

      const {rawValue} = AsyncAdTags.audit({StaticAdTags});
      expect(rawValue).to.equal(true);
    });

    it('should fail unless all ad tags are async', async () => {
      const StaticAdTags = [
        {attributes: ['async']},
        {attributes: []},
        {attributes: ['async']},
        {attributes: ['async']},
      ];

      const {rawValue} = AsyncAdTags.audit({StaticAdTags});
      expect(rawValue).to.equal(false);
    });
  });
});
