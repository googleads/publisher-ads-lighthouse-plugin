const LoadsGptOverHttps = require('../../audits/loads-gpt-over-https');
const {Audit} = require('lighthouse');
const {expect} = require('chai');

describe('LoadsGptOverHttps', async () => {
  describe('numGptHttpReqs', async () => {
    const testCases = [
      {
        networkRecords: [],
        expectedNumGptHttpReqs: 0,
        expectedNumGptHttpsReqs: 0,
        expectedNotAppl: true,
      },
      {
        networkRecords: [
          {url: 'http://example.com'},
          {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
          {url: 'https://www.googletagservices.com/tag/js/gpt.js'},
        ],
        expectedScore: 1,
        expectedNumGptHttpReqs: 0,
        expectedNumGptHttpsReqs: 1,
      },
      {
        networkRecords: [
          {url: 'http://example.com'},
          {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
          {url: 'https://www.googletagservices.com/tag/js/gpt.js'},
          {url: 'http://www.googletagservices.com/tag/js/gpt.js#foo'},
        ],
        expectedScore: 0,
        expectedNumGptHttpReqs: 1,
        expectedNumGptHttpsReqs: 1,
      },
      {
        networkRecords: [
          {url: 'http://example.com'},
          {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
          {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
          {url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        ],
        expectedScore: 0,
        expectedNumGptHttpReqs: 1,
        expectedNumGptHttpsReqs: 0,
      },
      {
        networkRecords: [
          {url: 'http://example.com'},
          {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
          {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
          {url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {url: 'http://www.googletagservices.com/tag/js/gpt.js#foo'},
          {url: 'https://www.googletagservices.com/tag/js/gpt.js'},
        ],
        expectedScore: 0,
        expectedNumGptHttpReqs: 2,
        expectedNumGptHttpsReqs: 1,
      },
      {
        networkRecords: [
          {url: 'http://example.com'},
          {url: 'https://facebook.com/foo?bar=baz'},
          {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
          {url: 'http://securepubads.g.doubleclick.net/gampad/ads?foo'},
          {url: 'http://www.googletagservices.com/tag/js/gpt.js?foo=bar'},
          {url: 'http://www.googletagservices.com/tag/js/gpt.js?cb=true'},
          {url: 'http://www.googletagservices.com/tag/js/gpt.js?foo=bar#baz'},
        ],
        expectedScore: 0,
        expectedNumGptHttpReqs: 3,
        expectedNumGptHttpsReqs: 0,
      },
    ];
    for (const {networkRecords, expectedScore, expectedNotAppl,
      expectedNumGptHttpReqs, expectedNumGptHttpsReqs} of testCases) {
      it(`should have a score of ${expectedScore} with` +
        ` ${expectedNumGptHttpReqs} HTTP requests and` +
        ` ${expectedNumGptHttpsReqs} HTTPS requests`, async () => {
        const results = await LoadsGptOverHttps.audit({
          devtoolsLogs: {[Audit.DEFAULT_PASS]: []},
          requestNetworkRecords: () => Promise.resolve(networkRecords),
        });
        if (expectedNotAppl) {
          expect(results).to.have.property('notApplicable', true);
        } else {
          expect(results).to.have.property('score', expectedScore);
        }
        expect(results).with.property('details')
            .property('numGptHttpReqs').equal(expectedNumGptHttpReqs);
        expect(results).with.property('details')
            .property('numGptHttpsReqs').equal(expectedNumGptHttpsReqs);
      });
    }
  });

  describe('numGptHttpsReqs', async () => {
    const testCases = [
      {
        networkRecords: [],
        expectedNumGptHttpReqs: 0,
        expectedNumGptHttpsReqs: 0,
        expectedNotAppl: true,
      },
      {
        networkRecords: [
          {url: 'http://example.com'},
          {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
          {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
          {url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        ],
        expectedScore: 0,
        expectedNumGptHttpReqs: 1,
        expectedNumGptHttpsReqs: 0,
      },
      {
        networkRecords: [
          {url: 'http://example.com'},
          {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
          {url: 'https://www.googletagservices.com/tag/js/gpt.js'},
          {url: 'https://www.googletagservices.com/tag/js/gpt.js?foo=bar'},
          {url: 'http://www.googletagservices.com/tag/js/gpt.js#foo'},
        ],
        expectedScore: 0,
        expectedNumGptHttpReqs: 1,
        expectedNumGptHttpsReqs: 2,
      },
      {
        networkRecords: [
          {url: 'http://example.com'},
          {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
          {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
          {url: 'https://www.googletagservices.com/tag/js/gpt.js'},
        ],
        expectedScore: 1,
        expectedNumGptHttpReqs: 0,
        expectedNumGptHttpsReqs: 1,
      },
      {
        networkRecords: [
          {url: 'http://example.com'},
          {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
          {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
          {url: 'https://www.googletagservices.com/tag/js/gpt.js'},
          {url: 'https://www.googletagservices.com/tag/js/gpt.js#foo'},
        ],
        expectedScore: 1,
        expectedNumGptHttpReqs: 0,
        expectedNumGptHttpsReqs: 2,
      },
      {
        networkRecords: [
          {url: 'http://example.com'},
          {url: 'https://facebook.com/foo?bar=baz'},
          {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
          {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
          {url: 'https://www.googletagservices.com/tag/js/gpt.js?foo=bar'},
          {url: 'https://www.googletagservices.com/tag/js/gpt.js?cb=true'},
          {url: 'https://www.googletagservices.com/tag/js/gpt.js?foo=bar#baz'},
        ],
        expectedScore: 1,
        expectedNumGptHttpReqs: 0,
        expectedNumGptHttpsReqs: 3,
      },
    ];
    for (const {networkRecords, expectedScore, expectedNotAppl,
      expectedNumGptHttpReqs, expectedNumGptHttpsReqs} of testCases) {
      it(`should have a score of ${expectedScore} with` +
        ` ${expectedNumGptHttpReqs} HTTP requests and` +
        ` ${expectedNumGptHttpsReqs} HTTPS requests`, async () => {
        const results = await LoadsGptOverHttps.audit({
          devtoolsLogs: {[Audit.DEFAULT_PASS]: []},
          requestNetworkRecords: () => Promise.resolve(networkRecords),
        });
        if (expectedNotAppl) {
          expect(results).to.have.property('notApplicable', true);
        } else {
          expect(results).to.have.property('score', expectedScore);
        }
        expect(results).with.property('details')
            .property('numGptHttpReqs').equal(expectedNumGptHttpReqs);
        expect(results).with.property('details')
            .property('numGptHttpsReqs').equal(expectedNumGptHttpsReqs);
      });
    }
  });
});
