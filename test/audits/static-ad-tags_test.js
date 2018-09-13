const NetworkRecorder = require('lighthouse/lighthouse-core/lib/network-recorder');
const sinon = require('sinon');
const StaticAdTags = require('../../audits/static-ad-tags');
const {expect} = require('chai');

describe('StaticAdTags', async () => {
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
        networkRecords: [],
        expectedRawVal: true,
      },
      {
        desc: 'should succeed if all ad tags are static',
        networkRecords: [
          {_initiator: {type: 'parser'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {_initiator: {type: 'parser'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {_initiator: {type: 'parser'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        ],
        expectedRawVal: true,
      },
      {
        desc: 'should succeed if all ad tags are preloaded',
        networkRecords: [
          {_initiator: {type: 'preload'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {_initiator: {type: 'preload'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {_initiator: {type: 'preload'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        ],
        expectedRawVal: true,
      },
      {
        desc: 'should succeed if all ad tags are static or preloaded',
        networkRecords: [
          {_initiator: {type: 'parser'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {_initiator: {type: 'preload'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {_initiator: {type: 'parser'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        ],
        expectedRawVal: true,
      },
      {
        desc: 'should fail unless all ad tags are static or preloaded',
        networkRecords: [
          {_initiator: {type: 'parser'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {_initiator: {type: 'script'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {_initiator: {type: 'preload'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {_initiator: {type: 'parser'}, url: 'http://www.googletagservices.com/tag/js/gpt.js'},
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
        const results = await StaticAdTags.audit(artifacts);
        expect(results).to.have.property('rawValue', expectedRawVal);
      });
    }
  });
});
