// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const chai = require('chai');
const FullWidthSlots = require('../../audits/full-width-slots');
const expect = chai.expect;
const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records.js');
const sinon = require('sinon');

describe('FullWidthSlots', async () => {
  const ViewportDimensions = {
    innerHeight: 200,
    innerWidth: 300,
  };

  const AD_REQUEST_URL = 'https://securepubads.g.doubleclick.net/gampad/ads?';
  const TAG_URL = 'https://securepubads.g.doubleclick.net/gpt/pubads_impl_243.js';
  const SRA_PARAM = 'prev_iu_szs=';
  const NON_SRA_PARAM = 'sz=';

  const genAdReqRecord = (sizeString = '', param = '') => ({
    url: (AD_REQUEST_URL + param + encodeURIComponent(sizeString)),
    initiator: {
      type: 'script',
      stack: {
        callFrames: [
          {url: TAG_URL},
        ],
      },
    },
    resourceType: 'XHR',
  });


  describe('fullWidthSlotsTest', async () => {
    let sandbox;
    beforeEach(() => {
      sandbox = sinon.createSandbox();
    });
    afterEach(() => {
      sandbox.restore();
    });
    const testCases = [
      {
        desc: 'should give min margin percentage for multiple sra requests',
        networkRecords: [
          {url: 'https://example.com'},
          genAdReqRecord('150x150,80x80|50x50,50x80', SRA_PARAM),
          genAdReqRecord('100x100,20x20', SRA_PARAM),
        ],
        expectedValue: .5,
        expectedNotApplicable: false,
      },
      {
        desc: 'should give min margin percentage for single sra request',
        networkRecords: [
          {url: 'https://example.com'},
          genAdReqRecord('100x100,20x20|150x150,80x80|50x50,50x80', SRA_PARAM),
        ],
        expectedValue: .5,
        expectedNotApplicable: false,
      },
      {
        desc: 'should give min margin percentage for multiple non-sra requests',
        networkRecords: [
          {url: 'https://example.com'},
          genAdReqRecord('150x150,80x80', NON_SRA_PARAM),
          genAdReqRecord('100x100', NON_SRA_PARAM),
        ],
        expectedValue: .5,
        expectedNotApplicable: false,
      },
      {
        desc: 'should give min margin percentage for single non-sra request',
        networkRecords: [
          {url: 'https://example.com'},
          genAdReqRecord('150x150', NON_SRA_PARAM),
        ],
        expectedValue: .5,
        expectedNotApplicable: false,
      },
      {
        desc: 'should not be applicable if no ads are requested',
        networkRecords: [
          {url: 'https://example.com'},
        ],
        expectedNotApplicable: true,
      },
      {
        desc: 'should not be applicable if no sizes are provided',
        networkRecords: [
          {url: 'https://example.com'},
          genAdReqRecord(),
        ],
        expectedNotApplicable: true,
      },
      {
        desc: 'should not be applicable if no valid sizes are provided',
        networkRecords: [
          {url: 'https://example.com'},
          genAdReqRecord('400x400,1x1', SRA_PARAM),
        ],
        expectedNotApplicable: true,
      },

    ];
    for (const {desc, networkRecords, expectedValue, expectedNotApplicable}
      of testCases) {
      it(`${desc} with a value of ${expectedValue}`, async () => {
        sandbox.stub(NetworkRecords, 'request').returns(networkRecords);
        const results = await FullWidthSlots.audit({
          devtoolsLogs: {},
          ViewportDimensions,
        });
        if (expectedNotApplicable) {
          expect(results).to.have.property('notApplicable', true);
        } else {
          expect(results).to.have.property('numericValue', expectedValue);
        }
      });
    }
  });
});
