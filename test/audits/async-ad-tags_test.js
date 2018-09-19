const AsyncAdTags = require('../../audits/async-ad-tags');
const NetworkRecorder = require('lighthouse/lighthouse-core/lib/network-recorder');
const sinon = require('sinon');
const {expect} = require('chai');

describe('AsyncAdTags', async () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

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
        sandbox.stub(NetworkRecorder, 'recordsFromLogs')
            .returns(networkRecords);
        const artifacts = {Network: {networkRecords}};
        const results = await AsyncAdTags.audit(artifacts);
        expect(results).to.have.property('rawValue', expectedRawVal);
      });
    }
  });
});
