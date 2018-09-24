const StaticAdTags = require('../../audits/static-ad-tags');
const {Audit} = require('lighthouse');
const {expect} = require('chai');

describe('StaticAdTags', async () => {
  describe('rawValue', async () => {
    const testCases = [
      {
        desc: 'should succeed if there are no ad tags',
        networkRecords: [],
        expectedRawVal: true,
      },
      {
        desc: 'should succeed if all ad tags are static',
        networkRecords: [
          {initiator: {type: 'parser'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {initiator: {type: 'parser'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {initiator: {type: 'parser'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        ],
        expectedRawVal: true,
      },
      {
        desc: 'should succeed if all ad tags are preloaded',
        networkRecords: [
          {initiator: {type: 'preload'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {initiator: {type: 'preload'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {initiator: {type: 'preload'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        ],
        expectedRawVal: true,
      },
      {
        desc: 'should succeed if all ad tags are static or preloaded',
        networkRecords: [
          {initiator: {type: 'parser'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {initiator: {type: 'preload'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {initiator: {type: 'parser'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        ],
        expectedRawVal: true,
      },
      {
        desc: 'should fail unless all ad tags are static or preloaded',
        networkRecords: [
          {initiator: {type: 'parser'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {initiator: {type: 'script'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {initiator: {type: 'preload'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {initiator: {type: 'parser'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        ],
        expectedRawVal: false,
      },
    ];

    for (const {desc, networkRecords, expectedRawVal}
      of testCases) {
      it(`${desc}`, async () => {
        const results = await StaticAdTags.audit({
          devtoolsLogs: {[Audit.DEFAULT_PASS]: []},
          requestNetworkRecords: () => Promise.resolve(networkRecords),
        });
        expect(results).to.have.property('rawValue', expectedRawVal);
      });
    }
  });
});
