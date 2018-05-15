const Ads = require('../../gatherers/ads');
const {expect} = require('chai')

describe('Ads', () => {
  describe('#afterPass', () => {
    it('should handle empty network logs', async () => {
      const networkRecords = [];
      const ads = new Ads();
      const data = await ads.afterPass({}, {networkRecords});
      expect(data).to.have.property('numRequests', 0);
    });

    it('should handle no ad requests', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
      ];
      const ads = new Ads();
      const data = await ads.afterPass({}, {networkRecords});
      expect(data).to.have.property('numRequests', 0);
    });

    it('should count 1 ad request', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
      ];
      const ads = new Ads();
      const data = await ads.afterPass({}, {networkRecords});
      expect(data).to.have.property('numRequests', 1);
    });

    it('should count 1 ad request on its own', async () => {
      const networkRecords = [
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
      ];
      const ads = new Ads();
      const data = await ads.afterPass({}, {networkRecords});
      expect(data).to.have.property('numRequests', 1);
    });

    it('should handle multiple ad requests', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
        {url: 'https://securepubads.g.doubleclick.net/other'},
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
      ];
      const ads = new Ads();
      const data = await ads.afterPass({}, {networkRecords});
      expect(data).to.have.property('numRequests', 3);
    });
  });
});
