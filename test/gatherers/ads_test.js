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

  describe('numImpressions', async () => {
    it('should handle empty network logs', async () => {
      const networkRecords = [];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));
      const ads = new Ads();
      const data = await ads.afterPass({}, networkRecords);
      expect(data).to.have.property('numImpressions', 0);
    });

    it('should return 0 impressions', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
        {url: 'https://securepubads.g.doubleclick.net/other'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));
      const ads = new Ads();
      const data = await ads.afterPass({}, {networkRecords});
      expect(data).to.have.property('numImpressions', 0);
    });

    it('should return 1 impression', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
        {url: 'https://googlesyndication.com/pcs/view?bar=baz'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));
      const ads = new Ads();
      const data = await ads.afterPass({}, {networkRecords});
      expect(data).to.have.property('numImpressions', 1);
    });

    it('should return 2 impressions', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://googlesyndication.com/file/folder/foo?bar=baz'},
        {url: 'https://googlesyndication.com/pagead/adview?bar=baz'},
        {url: 'https://googlesyndication.com/pcs/view?bar=baz'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));
      const ads = new Ads();
      const data = await ads.afterPass({}, {networkRecords});
      expect(data).to.have.property('numImpressions', 2);
    });
  });

  describe('numGptHttpReqs', () => {
    it('should return 0 gpt http reqs for empty network logs', async () => {
      const networkRecords = [];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));
      const ads = new Ads();
      const data = await ads.afterPass({}, networkRecords);
      expect(data).to.have.property('numGptHttpReqs', 0);
    });

    it('should return 0 gpt http reqs', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
        {url: 'https://www.googletagservices.com/tag/js/gpt.js'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));
      const ads = new Ads();
      const data = await ads.afterPass({}, {networkRecords});
      expect(data).to.have.property('numGptHttpReqs', 0);
    });

    it('should return 1 gpt http req and 1 gpt https req', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
        {url: 'https://www.googletagservices.com/tag/js/gpt.js'},
        {url: 'http://www.googletagservices.com/tag/js/gpt.js#foo'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));
      const ads = new Ads();
      const data = await ads.afterPass({}, {networkRecords});
      expect(data).to.have.property('numGptHttpReqs', 1);
      expect(data).to.have.property('numGptHttpsReqs', 1);
    });

    it('should return 1 gpt http req', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
        {url: 'http://www.googletagservices.com/tag/js/gpt.js'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));
      const ads = new Ads();
      const data = await ads.afterPass({}, {networkRecords});
      expect(data).to.have.property('numGptHttpReqs', 1);
    });

    it('should return 2 gpt http reqs', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
        {url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        {url: 'http://www.googletagservices.com/tag/js/gpt.js#foo'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));
      const ads = new Ads();
      const data = await ads.afterPass({}, {networkRecords});
      expect(data).to.have.property('numGptHttpReqs', 2);
    });

    it('should return 3 gpt http reqs', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://facebook.com/foo?bar=baz'},
        {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
        {url: 'http://securepubads.g.doubleclick.net/gampad/ads?foo'},
        {url: 'http://www.googletagservices.com/tag/js/gpt.js?foo=bar'},
        {url: 'http://www.googletagservices.com/tag/js/gpt.js?cb=true'},
        {url: 'http://www.googletagservices.com/tag/js/gpt.js?foo=bar#baz'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));
      const ads = new Ads();
      const data = await ads.afterPass({}, {networkRecords});
      expect(data).to.have.property('numGptHttpReqs', 3);
    });
  });

  describe('numGptHttpsReqs', () => {
    it('should return 0 gpt https reqs for empty network logs', async () => {
      const networkRecords = [];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));
      const ads = new Ads();
      const data = await ads.afterPass({}, networkRecords);
      expect(data).to.have.property('numGptHttpsReqs', 0);
    });

    it('should return 0 gpt https reqs', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
        {url: 'http://www.googletagservices.com/tag/js/gpt.js'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));
      const ads = new Ads();
      const data = await ads.afterPass({}, {networkRecords});
      expect(data).to.have.property('numGptHttpsReqs', 0);
    });

    it('should return 1 gpt https req and 2 gpt http req', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
        {url: 'https://www.googletagservices.com/tag/js/gpt.js'},
        {url: 'https://www.googletagservices.com/tag/js/gpt.js?foo=bar'},
        {url: 'http://www.googletagservices.com/tag/js/gpt.js#foo'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));
      const ads = new Ads();
      const data = await ads.afterPass({}, {networkRecords});
      expect(data).to.have.property('numGptHttpsReqs', 2);
      expect(data).to.have.property('numGptHttpReqs', 1);
    });

    it('should return 1 gpt https req', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
        {url: 'https://www.googletagservices.com/tag/js/gpt.js'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));
      const ads = new Ads();
      const data = await ads.afterPass({}, {networkRecords});
      expect(data).to.have.property('numGptHttpsReqs', 1);
    });

    it('should return 2 gpt https reqs', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
        {url: 'https://www.googletagservices.com/tag/js/gpt.js'},
        {url: 'https://www.googletagservices.com/tag/js/gpt.js#foo'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));
      const ads = new Ads();
      const data = await ads.afterPass({}, {networkRecords});
      expect(data).to.have.property('numGptHttpsReqs', 2);
    });

    it('should return 3 gpt https reqs', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://facebook.com/foo?bar=baz'},
        {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
        {url: 'https://www.googletagservices.com/tag/js/gpt.js?foo=bar'},
        {url: 'https://www.googletagservices.com/tag/js/gpt.js?cb=true'},
        {url: 'https://www.googletagservices.com/tag/js/gpt.js?foo=bar#baz'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));
      const ads = new Ads();
      const data = await ads.afterPass({}, {networkRecords});
      expect(data).to.have.property('numGptHttpsReqs', 3);
    });
  });
});
