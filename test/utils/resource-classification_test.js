const rc = require('../../utils/resource-classification');
const {expect} = require('chai');
const {URL} = require('url');

describe('resource-classification', () => {
  describe('#isGoogleAds', () => {
    it('should return true for DoubleClick links w/o subdomains', () => {
      const url = new URL('https://doubleclick.net/gpt/js/pubads.js');
      expect(rc.isGoogleAds(url)).to.be.true;
    });

    it('should return true for G-Syndication links w/o subdomains', () => {
      const url = new URL('https://googlesyndication.com/gpt/js/pubads.js');
      expect(rc.isGoogleAds(url)).to.be.true;
    });

    it('should return true for DoubleClick links w/ hash+query', () => {
      const url = new URL('https://www.doubleclick.net/tag/js/gpt.js?foo=bar#baz');
      expect(rc.isGoogleAds(url)).to.be.true;
    });

    it('should return true for G-Syndication links w/ hash+query', () => {
      const url = new URL('https://www.googlesyndication.com/tag/js/gpt.js?foo=bar#baz');
      expect(rc.isGoogleAds(url)).to.be.true;
    });

    it('should return true for DoubleClick w/ subdomain links', () => {
      const url = new URL('https://pagead2.doubleclick.net/pcs/activeview');
      expect(rc.isGoogleAds(url)).to.be.true;
    });

    it('should return true for G-Syndication w/ subdomain links', () => {
      const url = new URL('https://pagead2.googlesyndication.com/pcs/activeview');
      expect(rc.isGoogleAds(url)).to.be.true;
    });

    it('should return false for any other URL', () => {
      const url = new URL('https://facebook.com/foo?bar=baz#bat');
      expect(rc.isGoogleAds(url)).to.be.false;
    });
  });

  describe('#hasAdRequestPath', () => {
    it('should return true for /gampad/ads/ in the request path', () => {
      const url = new URL('https://securepubads.g.doubleclick.net/gampad/ads?bar=baz');
      expect(rc.hasAdRequestPath(url)).to.be.true;
    });

    it('should return false for any other ad request path', () => {
      const url = new URL('https://googlesyndication.com/file/folder?bar=baz');
      expect(rc.hasAdRequestPath(url)).to.be.false;
    });
  });

  describe('#hasImpressionPath', () => {
    it('should return true for /pcs/view as the impression path', () => {
      const url = new URL('https://googlesyndication.com/pcs/view?bar=baz');
      expect(rc.hasImpressionPath(url)).to.be.true;
    });

    it('should return true for /pagead/adview as the impression path', () => {
      const url = new URL('https://googlesyndication.com/pagead/adview?bar=baz');
      expect(rc.hasImpressionPath(url)).to.be.true;
    });

    it('should return false for any other impression path', () => {
      const url = new URL('https://googlesyndication.com/file/folder/foo?bar=baz');
      expect(rc.hasImpressionPath(url)).to.be.false;
    });
  });
});
