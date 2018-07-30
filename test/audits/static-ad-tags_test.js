const StaticAdTags = require('../../audits/static-ad-tags');
const {expect} = require('chai');

describe('StaticAdTags', () => {
  describe('rawValue', () => {
    it('should succeed if there are no ad tags', async () => {
      const networkRecords = [];

      const {rawValue} = StaticAdTags.audit({Network: {networkRecords}});
      expect(rawValue).to.equal(true);
    });

    it('should succeed if all ad tags are static', async () => {
      const networkRecords = [
        {_initiator: {type: 'parser'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        {_initiator: {type: 'parser'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        {_initiator: {type: 'parser'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
      ];

      const {rawValue} = StaticAdTags.audit({Network: {networkRecords}});
      expect(rawValue).to.equal(true);
    });

    it('should succeed if all ad tags are preloaded', async () => {
      const networkRecords = [
        {_initiator: {type: 'preload'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        {_initiator: {type: 'preload'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        {_initiator: {type: 'preload'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
      ];

      const {rawValue} = StaticAdTags.audit({Network: {networkRecords}});
      expect(rawValue).to.equal(true);
    });

    it('should succeed if all ad tags are static or preloaded', async () => {
      const networkRecords = [
        {_initiator: {type: 'parser'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        {_initiator: {type: 'preload'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        {_initiator: {type: 'parser'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
      ];

      const {rawValue} = StaticAdTags.audit({Network: {networkRecords}});
      expect(rawValue).to.equal(true);
    });

    it('should fail unless all ad tags are static or preloaded', async () => {
      const networkRecords = [
        {_initiator: {type: 'parser'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        {_initiator: {type: 'script'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        {_initiator: {type: 'preload'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        {_initiator: {type: 'parser'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
      ];

      const {rawValue} = StaticAdTags.audit({Network: {networkRecords}});
      expect(rawValue).to.equal(false);
    });
  });
});
