const HasAds = require('../../audits/has-ads');
const chromeDriver = require('chrome-har');
const sinon = require('sinon');
const {expect} = require('chai');
const {URL} = require('url');

/**
 * @param {!Array<{url: string}>} requests
 * @return {!Object} An object partly following the HAR spec.
 */
function newHar(requests) {
  const wrappedRequests = requests.map((req) => ({request: req}));
  return {log: {entries: wrappedRequests}};
}

describe('HasAds', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('numRequests', () => {
    it('should have a score of 0 for empty logs and 0 reqs', async () => {
      const networkRecords = [];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));

      const parsedUrls = networkRecords.map((request) => new URL(request.url));
      const results = HasAds.audit(
        {Network: {har: newHar(networkRecords), parsedUrls}});

      expect(results).with.property('score', 0);
      expect(results).with.property('details').property('numRequests').equal(0);
    });

    it('should have a score of 0 for no reqs logs and 0 reqs', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));

      const parsedUrls = networkRecords.map((request) => new URL(request.url));
      const results = HasAds.audit(
        {Network: {har: newHar(networkRecords), parsedUrls}});

      expect(results).with.property('score', 0);
      expect(results).with.property('details').property('numRequests').equal(0);
    });

    it('should have a score of 1 and 1 req', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));

      const parsedUrls = networkRecords.map((request) => new URL(request.url));
      const results = HasAds.audit(
        {Network: {har: newHar(networkRecords), parsedUrls}});

      expect(results).with.property('score', 1);
      expect(results).with.property('details').property('numRequests').equal(1);
    });

    it('should have a score of 1 and 1 req alone', async () => {
      const networkRecords = [
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));

      const parsedUrls = networkRecords.map((request) => new URL(request.url));
      const results = HasAds.audit(
        {Network: {har: newHar(networkRecords), parsedUrls}});

      expect(results).with.property('score', 1);
      expect(results).with.property('details').property('numRequests').equal(1);
    });

    it('should have a score of 1 and 3 reqs', async () => {
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

      const parsedUrls = networkRecords.map((request) => new URL(request.url));
      const results = HasAds.audit(
        {Network: {har: newHar(networkRecords), parsedUrls}});

      expect(results).with.property('score', 1);
      expect(results).with.property('details').property('numRequests').equal(3);
    });
  });

  describe('numImpressions', () => {
    it('should have a score of 0 for empty logs, 0 impressions', async () => {
      const networkRecords = [];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));

      const parsedUrls = networkRecords.map((request) => new URL(request.url));
      const results = HasAds.audit(
        {Network: {har: newHar(networkRecords), parsedUrls}});

      expect(results).with.property('score', 0);
      expect(results).with.property('details').
        property('numImpressions').equal(0);
    });

    it('should have a score of 0, 0 impressions w/ nonempty logs', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://securepubads.g.doubleclick.net/other'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));

      const parsedUrls = networkRecords.map((request) => new URL(request.url));
      const results = HasAds.audit(
        {Network: {har: newHar(networkRecords), parsedUrls}});

      expect(results).with.property('score', 0);
      expect(results).with.property('details').
        property('numImpressions').equal(0);
    });

    it('should have a score of 1, 1 impression', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
        {url: 'https://googlesyndication.com/pcs/view?bar=baz'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));

      const parsedUrls = networkRecords.map((request) => new URL(request.url));
      const results = HasAds.audit(
        {Network: {har: newHar(networkRecords), parsedUrls}});

      expect(results).with.property('score', 1);
      expect(results).with.property('details').
        property('numImpressions').equal(1);
    });

    it('should have a score of 1, 2 impressions', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
        {url: 'https://googlesyndication.com/pcs/view?bar=baz'},
        {url: 'https://googlesyndication.com/pagead/adview?bar=baz'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));

      const parsedUrls = networkRecords.map((request) => new URL(request.url));
      const results = HasAds.audit(
        {Network: {har: newHar(networkRecords), parsedUrls}});

      expect(results).with.property('score', 1);
      expect(results).with.property('details').
        property('numImpressions').equal(2);
    });
  });
});
