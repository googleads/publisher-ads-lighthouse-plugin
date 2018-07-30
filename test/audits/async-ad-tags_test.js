const AsyncAdTags = require('../../audits/async-ad-tags');
const {expect} = require('chai');

describe('AsyncAdTags', () => {
  describe('rawValue', () => {
    it('should succeed if there are no ad tags', async () => {
      const networkRecords = [];

      const {rawValue} = AsyncAdTags.audit({Network: {networkRecords}});
      expect(rawValue).to.equal(true);
    });

    it('should succeed if all ad tags are async', async () => {
      const networkRecords = [
        {priority: () => 'Low', url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        {priority: () => 'Low', url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        {priority: () => 'Low', url: 'http://www.googletagservices.com/tag/js/gpt.js'},
      ];

      const {rawValue} = AsyncAdTags.audit({Network: {networkRecords}});
      expect(rawValue).to.equal(true);
    });

    it('should fail unless all ad tags are async', async () => {
      const networkRecords = [
        {priority: () => 'Low', url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        {priority: () => 'High', url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        {priority: () => 'Low', url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        {priority: () => 'Low', url: 'http://www.googletagservices.com/tag/js/gpt.js'},
      ];

      const {rawValue} = AsyncAdTags.audit({Network: {networkRecords}});
      expect(rawValue).to.equal(false);
    });
  });
});
