const AsyncAdTags = require('../../audits/async-ad-tags');
const {Audit} = require('lighthouse');
const {expect} = require('chai');

describe('AsyncAdTags', async () => {
  describe('rawValue', async () => {
    const testCases = [
      {
        desc: 'should succeed if there are no ad tags',
        networkRecords: [
          {priority: 'Low', url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {priority: 'Low', url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {priority: 'Low', url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        ],
        expectedRawVal: true,
      },
      {
        desc: 'should succeed if all ad tags are async',
        networkRecords: [],
        expectedRawVal: true,
      },
      {
        desc: 'should fail unless all ad tags are async',
        networkRecords: [
          {priority: 'Low', url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {priority: 'High', url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {priority: 'Low', url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {priority: 'Low', url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        ],
        expectedRawVal: false,
      },
    ];

    for (const {desc, networkRecords, expectedRawVal}
      of testCases) {
      it(`${desc}`, async () => {
        const results = await AsyncAdTags.audit({
          devtoolsLogs: {[Audit.DEFAULT_PASS]: []},
          requestNetworkRecords: () => Promise.resolve(networkRecords),
        });
        expect(results).to.have.property('rawValue', expectedRawVal);
      });
    }
  });
});
