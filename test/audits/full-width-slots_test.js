const chai = require('chai');
const FullWidthSlots = require('../../audits/full-width-slots');
const {Audit} = require('lighthouse');
const expect = chai.expect;

describe('FullWidthSlots', async () => {
  const ViewportDimensions = {
    innerHeight: 200,
    innerWidth: 300,
  };

  const AD_REQUEST_URL = 'https://securepubads.g.doubleclick.net/gampad/ads?';
  const SRA_PARAM = 'prev_iu_szs=';
  const NON_SRA_PARAM = 'sz=';

  const genUrl = (sizeString, param) =>
    AD_REQUEST_URL + param + encodeURIComponent(sizeString);

  describe('fullWidthSlotsTest', async () => {
    const testCases = [
      {
        desc: 'should give min margin percentage for multiple sra requests',
        networkRecords: [
          {url: 'https://example.com'},
          {url: genUrl('150x150,80x80|50x50,50x80', SRA_PARAM)},
          {url: genUrl('100x100,20x20', SRA_PARAM)},
        ],
        expectedValue: .5,
        expectedNotApplicable: false,
      },
      {
        desc: 'should give min margin percentage for single sra request',
        networkRecords: [
          {url: 'https://example.com'},
          {url: genUrl('100x100,20x20|150x150,80x80|50x50,50x80', SRA_PARAM)},
        ],
        expectedValue: .5,
        expectedNotApplicable: false,
      },
      {
        desc: 'should give min margin percentage for multiple non-sra requests',
        networkRecords: [
          {url: 'https://example.com'},
          {url: genUrl('150x150,80x80', NON_SRA_PARAM)},
          {url: genUrl('100x100', NON_SRA_PARAM)},
        ],
        expectedValue: .5,
        expectedNotApplicable: false,
      },
      {
        desc: 'should give min margin percentage for single non-sra request',
        networkRecords: [
          {url: 'https://example.com'},
          {url: genUrl('150x150', NON_SRA_PARAM)},
        ],
        expectedValue: .5,
        expectedNotApplicable: false,
      },
      {
        desc: 'should not be applicable if no ads are requested',
        networkRecords: [
          {url: 'https://example.com'},
        ],
        expectedValue: true,
        expectedNotApplicable: true,
      },
      {
        desc: 'should not be applicable if no sizes are provided',
        networkRecords: [
          {url: 'https://example.com'},
          {url: AD_REQUEST_URL},
        ],
        expectedValue: true,
        expectedNotApplicable: true,
      },
      {
        desc: 'should not be applicable if no valid sizes are provided',
        networkRecords: [
          {url: 'https://example.com'},
          {url: genUrl('400x400,1x1', SRA_PARAM)},
        ],
        expectedValue: true,
        expectedNotApplicable: true,
      },

    ];
    for (const {desc, networkRecords, expectedValue, expectedNotApplicable}
      of testCases) {
      it(`${desc} with a value of ${expectedValue}`, async () => {
        const results = await FullWidthSlots.audit({
          devtoolsLogs: {[Audit.DEFAULT_PASS]: []},
          ViewportDimensions,
          requestNetworkRecords: () => Promise.resolve(networkRecords),
        });
        if (expectedNotApplicable) {
          expect(results).to.have.property('notApplicable', true);
        }
        expect(results).to.have.property('rawValue', expectedValue);
      });
    }
  });
});
