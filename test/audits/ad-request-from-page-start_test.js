const AdRequestFromPageStart = require('../../audits/ad-request-from-page-start');
const chai = require('chai');
const {Audit} = require('lighthouse');
const expect = chai.expect;

const AD_REQUEST_URL = 'https://securepubads.g.doubleclick.net/gampad/ads?foo';
const TAG_URL = 'https://securepubads.g.doubleclick.net/gpt/pubads_impl_243.js';

describe('AdRequestFromPageStart', async () => {
  describe('adRequestFromPageStartTest', async () => {
    const testCases = [
      {
        desc: 'should pass for records containing successful page and tag load',
        networkRecords: [
          {url: 'https://example.com', startTime: .25, statusCode: 200},
          {url: AD_REQUEST_URL, startTime: .5},
        ],
        expectedTime: 250,
      },
      {
        desc: 'should not be applicable if ad is never requested',
        networkRecords: [
          {url: TAG_URL, startTime: .5},
        ],
        expectedNotAppl: true,
      },
      {
        desc: 'should not be applicable if no successful requests',
        networkRecords: [],
        expectedNotAppl: true,
      },

    ];
    for (const {desc, networkRecords, expectedTime, expectedNotAppl}
      of testCases) {
      it(`${desc} with a load time of ${expectedTime}`, async () => {
        const results = await AdRequestFromPageStart.audit({
          devtoolsLogs: {[Audit.DEFAULT_PASS]: []},
          requestNetworkRecords: () => Promise.resolve(networkRecords),
        });
        if (expectedNotAppl) {
          expect(results).to.have.property('notApplicable', true);
        } else {
          expect(results).to.have.property('rawValue', expectedTime);
        }
      });
    }
  });
});
