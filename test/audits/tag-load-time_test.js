const TagLoadTime = require('../../audits/tag-load-time');
const chromeDriver = require('chrome-har');
const {expect} = require('chai');
const sinon = require('sinon');

const TAG_URL = 'https://securepubads.g.doubleclick.net/gpt/pubads_impl_243.js';

/**
 * @param {Array<{url: string}>} requests
 * @return {Object} An object partly following the HAR spec.
 */
function newHar(requests) {
  const wrappedRequests = requests.map((req) => ({request: req}));
  return {log: {entries: wrappedRequests}};
}

describe('TagLoadTime', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('tagLoadTimeTest', () => {
    const testCases = [
      {
        desc: 'should pass for records containing successful page and tag load',
        networkRecords: [
          {url: 'https://example.com', statusCode: 200, startTime: .1},
          {url: TAG_URL, endTime: .25},
        ],
        expectedLoadTime: 150,
        expectedError: false,
      },
      {
        desc: 'should throw error if tag is never loaded',
        networkRecords: [
          {url: 'https://example.com', statusCode: 200, startTime: .1},
        ],
        expectedLoadTime: -1,
        expectedError: true,
      },
      {
        desc: 'should throw error if no successful requests',
        networkRecords: [],
        expectedLoadTime: -1,
        expectedError: true,
      },

    ];
    for (const {desc, networkRecords, expectedLoadTime, expectedError}
      of testCases) {
      it(`${desc} with a load time of ${expectedLoadTime}`, () => {
        sandbox.stub(chromeDriver, 'harFromMessages')
          .returns(newHar(networkRecords));
        const artifacts =
            {Network: {har: newHar(networkRecords), networkRecords}};

        if (!expectedError) {
          const results = TagLoadTime.audit(artifacts);
          expect(results).to.have.property('rawValue', expectedLoadTime);
        } else {
          expect(() => TagLoadTime.audit(artifacts)).to.throw();
        }
      });
    }
  });
});
