// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const {expect} = require('chai');
const {isGoogleAds, isGptAdRequest, isImpressionPing, isGptTag, isGptImplTag, isAMPTag, isAMPAdRequest, isAdRelated} = require('../../utils/resource-classification');

describe('resource-classification', () => {
  describe('#isGoogleAds', () => {
    const testCases = [
      {
        description: 'DoubleClick links without subdomains',
        url: new URL('https://doubleclick.net/gpt/js/pubads.js'),
        expectation: true,
      },
      {
        description: 'Googlesyndication links without subdomains',
        url: new URL('https://googlesyndication.com/gpt/js/pubads.js'),
        expectation: true,
      },
      {
        description: 'DoubleClick lnks with hash and query',
        url: new URL('https://www.doubleclick.net/tag/js/gpt.js?foo=bar#baz'),
        expectation: true,
      },
      {
        description: 'Googlesyndication links with hash and query',
        url: new URL('https://www.googlesyndication.com/tag/js/gpt.js?foo=bar#baz'),
        expectation: true,
      },
      {
        description: 'DoubleClick links with subdomains',
        url: new URL('https://pagead2.doubleclick.net/pcs/activeview'),
        expectation: true,
      },
      {
        description: 'Googlesyndication links with subdomains',
        url: new URL('https://pagead2.googlesyndication.com/pcs/activeview'),
        expectation: true,
      },
      {
        description: 'any other URL',
        url: new URL('https://facebook.com/foo?bar=baz#bat'),
        expectation: false,
      },
    ];
    for (const {description, url, expectation} of testCases) {
      it(`should return ${expectation} for ${description}`, () => {
        const results = isGoogleAds(url);
        expect(results).to.equal(expectation);
      });
    }
  });

  describe('#isGptAdRequest', () => {
    it('should return true for /gampad/ads in the request path', () => {
      const record = {
        url: 'https://securepubads.g.doubleclick.net/gampad/ads?bar=baz',
        initiator: {
          type: 'script',
          stack: {
            callFrames: [
              {
                url: 'https://google.com',
              },
              {
                url: 'https://securepubads.g.doubleclick.net/gpt/pubads_impl_19700101.js?1234',
              },
            ],
          },
        },
        resourceType: 'XHR',
      };
      expect(isGptAdRequest(record)).to.be.true;
    });

    it('should return false for any other ad request path', () => {
      const record = {
        url: 'https://drive.google.com?bar=baz',
        initiator: {
          type: 'script',
          stack: {
            callFrames: [
              {
                url: 'https://google.com',
              },
              {
                url: 'https://securepubads.g.doubleclick.net/gpt/pubads_impl_19700101.js?1234',
              },
            ],
          },
        },
      };
      expect(isAMPAdRequest(record)).to.be.false;
    });
  });

  describe('#isAMPAdRequest', () => {
    it('should return true for /gampad/ads in the request path', () => {
      const record = {
        url: 'https://securepubads.g.doubleclick.net/gampad/ads?bar=baz',
        initiator: {
          type: 'script',
          stack: {
            callFrames: [
              {
                url: 'https://google.com',
              },
              {
                url: 'https://securepubads.g.doubleclick.net/gpt/pubads_impl_19700101.js?1234',
              },
            ],
          },
        },
        resourceType: 'Fetch',
      };
      expect(isAMPAdRequest(record)).to.be.true;
    });

    it('should return false for any other ad request path', () => {
      const record = {
        url: 'https://drive.google.com?bar=baz',
        initiator: {
          type: 'script',
          stack: {
            callFrames: [
              {
                url: 'https://google.com',
              },
              {
                url: 'https://securepubads.g.doubleclick.net/gpt/pubads_impl_19700101.js?1234',
              },
            ],
          },
        },
      };
      expect(isGptAdRequest(record)).to.be.false;
    });
  });

  describe('#isImpressionPing', () => {
    it('should return true for securepubads.g.doubleclick.net/pcs/view', () => {
      const url = new URL('https://securepubads.g.doubleclick.net/pcs/view?bar=baz');
      expect(isImpressionPing(url)).to.be.true;
    });

    it('should return true for googleads4.g.doubleclick.net/pcs/view', () => {
      const url = new URL('https://googleads4.g.doubleclick.net/pcs/view?bar=baz');
      expect(isImpressionPing(url)).to.be.true;
    });

    it('should return true for securepubads.g.doubleclick.net/pagead/adview as the impression path', () => {
      const url = new URL('https://securepubads.g.doubleclick.net/pagead/adview?bar=baz');
      expect(isImpressionPing(url)).to.be.true;
    });

    it('should return false for any other impression path', () => {
      const url = new URL('https://securepubads.g.doubleclick.net/file/folder/foo?bar=baz');
      expect(isImpressionPing(url)).to.be.false;
    });
  });

  describe('#isGptTag', () => {
    const testCases = [
      {
        description: 'URLs that load gpt.js from GTS',
        url: new URL('http://www.googletagservices.com/tag/js/gpt.js'),
        expectation: true,
      },
      {
        description: 'URLs that load gpt.js from pagead2',
        url: new URL('http://pagead2.googlesyndication.com/tag/js/gpt.js'),
        expectation: true,
      },
      {
        description: 'URLs that load gpt.js',
        url: new URL('http://securepubads.g.doubleclick.net/tag/js/gpt.js'),
        expectation: true,
      },
      {
        description: 'URLs that load gpt.js with hash',
        url: new URL('https://securepubads.g.doubleclick.net/tag/js/gpt.js#foo'),
        expectation: true,
      },
      {
        description: 'URLs that load gpt.js with query string',
        url: new URL('https://securepubads.g.doubleclick.net/tag/js/gpt.js?foo=bar'),
        expectation: true,
      },
      {
        description: 'URLs that load gpt.js with query string and hash',
        url: new URL('https://securepubads.g.doubleclick.net/tag/js/gpt.js?foo=bar#baz'),
        expectation: true,
      },
      {
        description: 'URLs that don\'t load gpt.js',
        url: new URL('https://facebook.com/foo?bar=baz'),
        expectation: false,
      },
    ];
    for (const {description, url, expectation} of testCases) {
      it(`should return ${expectation} for ${description}`, () => {
        const results = isGptTag(url);
        expect(results).to.equal(expectation);
      });
    }
  });
  describe('#isGptImplTag', () => {
    const testCases = [
      {
        description: 'Standard tag matches',
        url: new URL('https://securepubads.g.doubleclick.net/gpt/pubads_impl_19700101.js?1234'),
        expectation: true,
      },
      {
        description: 'Standard tag matches on pagead2',
        url: new URL('https://pagead2.googlesyndication.com/gpt/pubads_impl_19700101.js?1234'),
        expectation: true,
      },
      {
        description: 'Non-standard tag matches',
        url: new URL('https://securepubads.g.doubleclick.net/gpt/pubads_impl_modern_19700101.js'),
        expectation: true,
      },
      {
        description: 'Standard rendering tag does not match.',
        url: new URL('https://securepubads.g.doubleclick.net/gpt/pubads_impl_rendering_19700101.js?1234'),
        expectation: false,
      },
      {
        description: 'Standard rendering tag does not match.',
        url: new URL('https://securepubads.g.doubleclick.net/gpt/pubads_impl_test_rendering_19700101.js?1234'),
        expectation: false,
      },
    ];
    for (const {description, url, expectation} of testCases) {
      it(`should return ${expectation} for ${description}`, () => {
        const results = isGptImplTag(url);
        expect(results).to.equal(expectation);
      });
    }
  });
  describe('#isAMPTag', () => {
    const testCases = [
      {
        description: 'Standard tag matches',
        url: new URL('https://cdn.ampproject.org/v0/amp-ad-0.1.js'),
        expectation: true,
      },
      {
        description: 'Standard rendering tag does not match.',
        url: new URL('https://securepubads.g.doubleclick.net/gpt/pubads_impl_rendering_19700101.js?1234'),
        expectation: false,
      },
      {
        description: 'Standard rendering tag does not match.',
        url: new URL('https://securepubads.g.doubleclick.net/gpt/pubads_impl_test_rendering_19700101.js?1234'),
        expectation: false,
      },
    ];
    for (const {description, url, expectation} of testCases) {
      it(`should return ${expectation} for ${description}`, () => {
        const results = isAMPTag(url);
        expect(results).to.equal(expectation);
      });
    }
  });
  describe('#isAdRelated', () => {
    const testCases = [
      {
        description: 'undefined url property',
        requestOrUrl: {},
        expectation: false,
      },
      {
        description: 'empty string url',
        requestOrUrl: '',
        expectation: false,
      },
      {
        description: 'empty string url property',
        requestOrUrl: {
          url: '',
        },
        expectation: false,
      },
      {
        description: 'ad script url passed as the url property',
        requestOrUrl: {
          url: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
        },
        expectation: true,
      },
      {
        description: 'ad script url',
        requestOrUrl: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
        expectation: true,
      },
      {
        description: 'header bidder url',
        requestOrUrl: 'https://acdn.adnxs.com/prebid/foo.js',
        expectation: true,
      },
      {
        description: 'url that is a known third party in the ad category',
        requestOrUrl: 'https://t.mookie1.com/foo.js',
        expectation: true,
      },
      {
        description: 'url that is a known third party, but not in the ad category',
        requestOrUrl: 'https://beacon-v2.helpscout.net/',
        expectation: false,
      },
      {
        description: 'url that is not an ad script, header bidder, or known third party',
        requestOrUrl: 'https://foo.com',
        expectation: false,
      },
    ];
    for (const {description, requestOrUrl, expectation} of testCases) {
      it(`should return ${expectation} for ${description}`, () => {
        const results = isAdRelated(requestOrUrl);
        expect(results).to.equal(expectation);
      });
    }
  });
});
