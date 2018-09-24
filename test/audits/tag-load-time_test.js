const chai = require('chai');
const TagLoadTime = require('../../audits/tag-load-time');
const expect = chai.expect;
const {Audit} = require('lighthouse');

const TAG_URL = 'https://securepubads.g.doubleclick.net/gpt/pubads_impl_243.js';

describe('TagLoadTime', async () => {
  describe('tagLoadTimeTest', async () => {
    const testCases = [
      {
        desc: 'should pass for records containing successful page and tag load',
        networkRecords: [
          {url: 'https://example.com', statusCode: 200, startTime: .1},
          {url: TAG_URL, endTime: .25},
        ],
        expectedLoadTime: 150,
      },
      {
        desc: 'should not be applicable if tag is never loaded',
        networkRecords: [
          {url: 'https://example.com', statusCode: 200, startTime: .1},
        ],
        expectedNotAppl: true,
      },
      {
        desc: 'should not be applicable if no successful requests',
        networkRecords: [],
        expectedNotAppl: true,
      },

    ];
    for (const {desc, networkRecords, expectedLoadTime, expectedNotAppl}
      of testCases) {
      it(`${desc} with a load time of ${expectedLoadTime}`, async () => {
        const results = await TagLoadTime.audit({
          devtoolsLogs: {[Audit.DEFAULT_PASS]: []},
          requestNetworkRecords: () => Promise.resolve(networkRecords),
        });
        if (!expectedNotAppl) {
          expect(results).to.have.property('rawValue', expectedLoadTime);
        } else {
          expect(results).to.have.property('notApplicable', true);
        }
      });
    }
  });
});
