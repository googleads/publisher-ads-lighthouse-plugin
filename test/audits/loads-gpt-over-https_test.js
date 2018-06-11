const LoadsGptOverHttps = require('../../audits/loads-gpt-over-https');
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

describe('LoadsGptOverHttps', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('numGptHttpReqs', () => {
    it('should have a score of 1 for empty logs and 0 reqs', async () => {
      const networkRecords = [];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));

      const parsedUrls = networkRecords.map((request) => new URL(request.url));
      const results = LoadsGptOverHttps.audit(
        {Network: {har: newHar(networkRecords), parsedUrls}});

      expect(results).to.have.property('score', 1);
      expect(results).with.property('details').
        property('numGptHttpReqs').equal(0);
      expect(results).with.property('details').
        property('numGptHttpsReqs').equal(0);
    });

    it('should have score of 1, 0 http reqs, 1 https req', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
        {url: 'https://www.googletagservices.com/tag/js/gpt.js'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));

      const parsedUrls = networkRecords.map((request) => new URL(request.url));
      const results = LoadsGptOverHttps.audit(
        {Network: {har: newHar(networkRecords), parsedUrls}});

      expect(results).to.have.property('score', 1);
      expect(results).with.property('details').
        property('numGptHttpReqs').equal(0);
      expect(results).with.property('details').
        property('numGptHttpsReqs').equal(1);
    });

    it('should have score of 0, 1 http req, and 1 https req', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
        {url: 'https://www.googletagservices.com/tag/js/gpt.js'},
        {url: 'http://www.googletagservices.com/tag/js/gpt.js#foo'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));

      const parsedUrls = networkRecords.map((request) => new URL(request.url));
      const results = LoadsGptOverHttps.audit(
        {Network: {har: newHar(networkRecords), parsedUrls}});

      expect(results).to.have.property('score', 0);
      expect(results).with.property('details').
        property('numGptHttpReqs').equal(1);
      expect(results).with.property('details').
        property('numGptHttpsReqs').equal(1);
    });

    it('should have score of 0, 1 http req, and 0 https reqs', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
        {url: 'http://www.googletagservices.com/tag/js/gpt.js'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));

      const parsedUrls = networkRecords.map((request) => new URL(request.url));
      const results = LoadsGptOverHttps.audit(
        {Network: {har: newHar(networkRecords), parsedUrls}});

      expect(results).to.have.property('score', 0);
      expect(results).with.property('details').
        property('numGptHttpReqs').equal(1);
      expect(results).with.property('details').
        property('numGptHttpsReqs').equal(0);
    });


    it('should have score of 0, 2 http reqs, and 1 https reqs', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
        {url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        {url: 'http://www.googletagservices.com/tag/js/gpt.js#foo'},
        {url: 'https://www.googletagservices.com/tag/js/gpt.js'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));

      const parsedUrls = networkRecords.map((request) => new URL(request.url));
      const results = LoadsGptOverHttps.audit(
        {Network: {har: newHar(networkRecords), parsedUrls}});

      expect(results).to.have.property('score', 0);
      expect(results).with.property('details').
        property('numGptHttpReqs').equal(2);
      expect(results).with.property('details').
        property('numGptHttpsReqs').equal(1);
    });

    it('should have score of 0, 3 http reqs, and 0 https reqs', async () => {
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

      const parsedUrls = networkRecords.map((request) => new URL(request.url));
      const results = LoadsGptOverHttps.audit(
        {Network: {har: newHar(networkRecords), parsedUrls}});

      expect(results).to.have.property('score', 0);
      expect(results).with.property('details').
        property('numGptHttpReqs').equal(3);
      expect(results).with.property('details').
        property('numGptHttpsReqs').equal(0);
    });
  });

  describe('numGptHttpsReqs', async () => {
    it('should have a score of 1 for empty logs and 0 reqs', async () => {
      const networkRecords = [];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));

      const parsedUrls = networkRecords.map((request) => new URL(request.url));
      const results = LoadsGptOverHttps.audit(
        {Network: {har: newHar(networkRecords), parsedUrls}});

      expect(results).to.have.property('score', 1);
      expect(results).with.property('details').
        property('numGptHttpReqs').equal(0);
      expect(results).with.property('details').
        property('numGptHttpsReqs').equal(0);
    });

    it('should have a score of 0, 1 http req, 0 https reqs', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
        {url: 'http://www.googletagservices.com/tag/js/gpt.js'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));

      const parsedUrls = networkRecords.map((request) => new URL(request.url));
      const results = LoadsGptOverHttps.audit(
        {Network: {har: newHar(networkRecords), parsedUrls}});

      expect(results).to.have.property('score', 0);
      expect(results).with.property('details').
        property('numGptHttpReqs').equal(1);
      expect(results).with.property('details').
        property('numGptHttpsReqs').equal(0);
    });

    it('should have a score of 0, 1 http req, 2 https req', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
        {url: 'https://www.googletagservices.com/tag/js/gpt.js'},
        {url: 'https://www.googletagservices.com/tag/js/gpt.js?foo=bar'},
        {url: 'http://www.googletagservices.com/tag/js/gpt.js#foo'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));

      const parsedUrls = networkRecords.map((request) => new URL(request.url));
      const results = LoadsGptOverHttps.audit(
        {Network: {har: newHar(networkRecords), parsedUrls}});

      expect(results).to.have.property('score', 0);
      expect(results).with.property('details').
        property('numGptHttpReqs').equal(1);
      expect(results).with.property('details').
        property('numGptHttpsReqs').equal(2);
    });

    it('should have a score of 1, 0 http req, 1 https req', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
        {url: 'https://www.googletagservices.com/tag/js/gpt.js'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));

      const parsedUrls = networkRecords.map((request) => new URL(request.url));
      const results = LoadsGptOverHttps.audit(
        {Network: {har: newHar(networkRecords), parsedUrls}});

      expect(results).to.have.property('score', 1);
      expect(results).with.property('details').
        property('numGptHttpReqs').equal(0);
      expect(results).with.property('details').
        property('numGptHttpsReqs').equal(1);
    });

    it('should have a score of 1, 0 http reqs, 2 https req', async () => {
      const networkRecords = [
        {url: 'http://example.com'},
        {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
        {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
        {url: 'https://www.googletagservices.com/tag/js/gpt.js'},
        {url: 'https://www.googletagservices.com/tag/js/gpt.js#foo'},
      ];
      sandbox.stub(chromeDriver, 'harFromMessages')
        .returns(newHar(networkRecords));

      const parsedUrls = networkRecords.map((request) => new URL(request.url));
      const results = LoadsGptOverHttps.audit(
        {Network: {har: newHar(networkRecords), parsedUrls}});

      expect(results).to.have.property('score', 1);
      expect(results).with.property('details').
        property('numGptHttpReqs').equal(0);
      expect(results).with.property('details').
        property('numGptHttpsReqs').equal(2);
    });

    it('should have a score of 1, 0 http reqs, 3 https req', async () => {
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

      const parsedUrls = networkRecords.map((request) => new URL(request.url));
      const results = LoadsGptOverHttps.audit(
        {Network: {har: newHar(networkRecords), parsedUrls}});

      expect(results).to.have.property('score', 1);
      expect(results).with.property('details').
        property('numGptHttpReqs').equal(0);
      expect(results).with.property('details').
        property('numGptHttpsReqs').equal(3);
    });
  });
});
