const Ads = require('../../gatherers/ads');
const chromeDriver = require('chrome-har');
const sinon = require('sinon');
const {expect} = require('chai');

/**
 * @param {!Array<{url: string}>} requests
 * @return {!Object} An object partly following the HAR spec.
 */
function newHar(requests) {
  const wrappedRequests = requests.map((req) => ({request: req}));
  return {log: {entries: wrappedRequests}};
}

describe('Ads', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('numRequests', () => {
    it('should handle empty network logs', async () => {
      const networkRecords = [];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));
      const ads = new Ads();
      const data = await ads.afterPass({}, networkRecords);
      expect(data).to.have.property('numRequests', 0);
    });

    it('should handle no ad requests', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));
      const ads = new Ads();
      const data = await ads.afterPass({}, networkRecords);
      expect(data).to.have.property('numRequests', 0);
    });

    it('should count 1 ad request', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));
      const ads = new Ads();
      const data = await ads.afterPass({}, {networkRecords});
      expect(data).to.have.property('numRequests', 1);
    });

    it('should count 1 ad request on its own', async () => {
      const networkRecords = [
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));
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
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));
      const ads = new Ads();
      const data = await ads.afterPass({}, {networkRecords});
      expect(data).to.have.property('numRequests', 3);
    });
  });
});
