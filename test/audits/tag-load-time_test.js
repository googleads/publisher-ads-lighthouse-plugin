const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const NetworkRecorder = require('lighthouse/lighthouse-core/lib/network-recorder');
const TagLoadTime = require('../../audits/tag-load-time');
const expect = chai.expect;
const sinon = require('sinon');
chai.use(chaiAsPromised);

const TAG_URL = 'https://securepubads.g.doubleclick.net/gpt/pubads_impl_243.js';

/**
 * @param {Array<{url: string}>} requests
 * @return {Object} An object partly following the HAR spec.
 */
function newHar(requests) {
  const wrappedRequests = requests.map((req) => ({request: req}));
  return {log: {entries: wrappedRequests}};
}

describe('TagLoadTime', async () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('tagLoadTimeTest', async () => {
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
      it(`${desc} with a load time of ${expectedLoadTime}`, async () => {
        sandbox.stub(NetworkRecorder, 'recordsFromLogs')
          .returns(networkRecords);
        const artifacts =
            {Network: {har: newHar(networkRecords), networkRecords}};

        if (!expectedError) {
          const results = await TagLoadTime.audit(artifacts);
          expect(results).to.have.property('rawValue', expectedLoadTime);
        } else {
          await expect(TagLoadTime.audit(artifacts)).to.be.rejectedWith(Error);
        }
      });
    }
  });
});
