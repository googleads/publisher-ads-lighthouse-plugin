const AdRequestFromTagLoad = require('../../audits/ad-request-from-tag-load');
const chromeDriver = require('chrome-har');
const {expect} = require('chai');
const sinon = require('sinon');

const AD_REQUEST_URL = 'https://securepubads.g.doubleclick.net/gampad/ads?foo';
const TAG_URL = 'https://securepubads.g.doubleclick.net/gpt/pubads_impl_243.js';

/**
 * @param {Array<{url: string}>} requests
 * @return {Object} An object partly following the HAR spec.
 */
function newHar(requests) {
  const wrappedRequests = requests.map((req) => ({request: req}));
  return {log: {entries: wrappedRequests}};
}

describe('AdRequestFromTagLoad', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('adRequestFromTagLoadTest', () => {
    const testCases = [
      {
        desc: 'should pass for records containing successful page and tag load',
        networkRecords: [
          {url: TAG_URL, endTime: .25},
          {url: AD_REQUEST_URL, startTime: .5},
        ],
        expectedTime: 250,
        expectedError: false,
      },
      {
        desc: 'should throw error if tag is never loaded',
        networkRecords: [
          {url: AD_REQUEST_URL, startTime: .5},
        ],
        expectedTime: -1,
        expectedError: true,
      },
      {
        desc: 'should throw error if ad is never requested',
        networkRecords: [
          {url: TAG_URL, startTime: .5},
        ],
        expectedTime: -1,
        expectedError: true,
      },

    ];
    for (const {desc, networkRecords, expectedTime, expectedError}
      of testCases) {
      it(`${desc} with a load time of ${expectedTime}`, () => {
        sandbox.stub(chromeDriver, 'harFromMessages')
          .returns(newHar(networkRecords));
        const artifacts =
            {Network: {har: newHar(networkRecords), networkRecords}};

        if (!expectedError) {
          const results = AdRequestFromTagLoad.audit(artifacts);
          expect(results).to.have.property('rawValue', expectedTime);
        } else {
          expect(() => AdRequestFromTagLoad.audit(artifacts)).to.throw();
        }
      });
    }
  });
});
