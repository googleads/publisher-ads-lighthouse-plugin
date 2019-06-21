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

const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records');
const SerialHeaderBidding = require('../../audits/serial-header-bidding');
const sinon = require('sinon');
const {expect} = require('chai');

describe('SerialHeaderBidding', async () => {
  let sandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('hasSerialHeaderBidding', async () => {
    const testCases = [
      {
        desc: 'should be non applicable for empty records',
        networkRecords: [],
        expectedNotAppl: true,
      },
      {
        desc: 'should be non applicable for records with non-header bidding domains',
        networkRecords: [
          {url: 'https://example.com', startTime: 5, endTime: 10, statusCode: 200},
          {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo', startTime: 10, endTime: 15},
          {url: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js', startTime: 15, endTime: 20},
        ],
        expectedNotAppl: true,
      },
      {
        desc: 'should fail for records with header bidding domains',
        networkRecords: [
          {url: 'https://aax.amazon-adsystem.com/e/dtb/bid', startTime: 5, endTime: 10},
          {url: 'http://contextual.media.net/bidexchange.js', startTime: 10, endTime: 15},
        ],
        expectedScore: 0,
      },
      {
        desc: 'should fail for records with max start time = min end time',
        networkRecords: [
          {url: 'https://aax.amazon-adsystem.com/e/dtb/bid', startTime: 5, endTime: 10},
          {url: 'http://contextual.media.net/bidexchange.js', startTime: 10, endTime: 15},
        ],
        expectedScore: 0,
      },
      {
        desc: 'should fail for records with max start time > min end time',
        networkRecords: [
          {url: 'https://aax.amazon-adsystem.com/e/dtb/bid', startTime: 5, endTime: 10},
          {url: 'http://contextual.media.net/bidexchange.js', startTime: 15, endTime: 20},
        ],
        expectedScore: 0,
      },
      {
        desc: 'should pass for records with max start time < min end time',
        networkRecords: [
          {url: 'https://aax.amazon-adsystem.com/e/dtb/bid', startTime: 1, endTime: 3},
          {url: 'http://contextual.media.net/bidexchange.js', startTime: 2, endTime: 15},
        ],
        expectedScore: 1,
      },
      {
        desc: 'should fail for multiple records',
        networkRecords: [
          {url: 'https://aax.amazon-adsystem.com/e/dtb/bid', startTime: 5, endTime: 10},
          {url: 'http://contextual.media.net/bidexchange.js', startTime: 7, endTime: 9},
          {url: 'http://as.casalemedia.com/cygnus', startTime: 15, endTime: 20},
        ],
        expectedScore: 0,
      },
      {
        desc: 'should ignore resources with 0 resource size',
        networkRecords: [
          {url: 'https://aax.amazon-adsystem.com/e/dtb/bid', startTime: 5, endTime: 10, resourceSize: 100},
          {url: 'http://contextual.media.net/bidexchange.js', startTime: 7, endTime: 9, resourceSize: 200},
          {url: 'http://as.casalemedia.com/cygnus', startTime: 15, endTime: 20, resourceSize: 0},
        ],
        // Passes since the final (serial) request has no response body.
        expectedScore: 1,
      },
      {
        desc: 'should pass for one record',
        networkRecords: [
          {url: 'http://as.casalemedia.com/cygnus', startTime: 5, endTime: 10},
        ],
        expectedScore: 1,
      },
    ];
    for (const {
      desc, networkRecords, expectedScore, expectedNotAppl} of testCases) {
      it(`${desc} with score of ${expectedScore}`, async () => {
        sandbox.stub(NetworkRecords, 'request').returns(networkRecords);
        const results = await SerialHeaderBidding.audit(
          {devtoolsLogs: {}, traces: {}}, {settings: {}});
        if (expectedNotAppl) {
          expect(results).to.have.property('notApplicable', true);
        } else {
          expect(results).to.have.property('score', expectedScore);
        }
      });
    }
  });

  describe('checkFilteredRecords', async () => {
    const testCases = [
      {
        desc: 'not applicable for empty network records',
        networkRecords: [],
        expectedNotAppl: true,
      },
      {
        desc: 'not applicable for non-ads/non-bidding records',
        networkRecords: [
          {
            startTime: 10,
            endTime: 20,
            url: 'https://example.com',
            statusCode: 200,
          },
          {
            startTime: 10,
            endTime: 20,
            url: 'https://foo.com',
          },
        ],
        expectedNotAppl: true,
      },
      {
        desc: 'not applicable for no bidding records',
        networkRecords: [
          {
            startTime: 0,
            endTime: 10,
            url: 'https://example.com',
            statusCode: 200,
          },
          {
            startTime: 10,
            endTime: 20,
            url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo',
          },
        ],
        expectedNotAppl: true,
      },
      {
        desc: '0 ads and 2 bidding records',
        networkRecords: [
          {
            startTime: 10,
            endTime: 20,
            url: 'https://example.com',
            statusCode: 200,
          },
          {
            startTime: 25,
            endTime: 35,
            url: 'https://aax.amazon-adsystem.com/e/dtb/bid',
            statusCode: 200,
          },
          {
            startTime: 36,
            endTime: 40,
            url: 'https://bidder.criteo.com/cdb/',
          },
        ],
        expectedAdsRecords: [],
        expectedHeaderBiddingRecords: [
          {
            startTime: 15000,
            endTime: 25000,
            duration: 10000,
            url: 'https://aax.amazon-adsystem.com/e/dtb/bid',
            type: 'bid',
          },
          {
            startTime: 26000,
            endTime: 30000,
            duration: 4000,
            url: 'https://bidder.criteo.com/cdb/',
            type: 'bid',
          },
        ],
      },
      {
        desc: '1 ads and 2 bidding records',
        networkRecords: [
          {
            startTime: 10,
            endTime: 20,
            url: 'https://example.com',
            statusCode: 200,
          },
          {
            startTime: 15,
            endTime: 30,
            url: 'https://foo.com',
          },
          {
            startTime: 25,
            endTime: 35,
            url: 'https://bidder.criteo.com/cdb/',
          },
          {
            startTime: 40,
            endTime: 50,
            url: 'https://aax.amazon-adsystem.com/e/dtb/bid',
            statusCode: 200,
          },
          {
            startTime: 30,
            endTime: 40,
            url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo',
          },
        ],
        expectedAdsRecords: [
          {
            startTime: 20000,
            endTime: 30000,
            duration: 10000,
            url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo',
            type: 'ad',
          },
        ],
        expectedHeaderBiddingRecords: [
          {
            startTime: 15000,
            endTime: 25000,
            duration: 10000,
            url: 'https://bidder.criteo.com/cdb/',
            type: 'bid',
          },
          {
            startTime: 30000,
            endTime: 40000,
            duration: 10000,
            url: 'https://aax.amazon-adsystem.com/e/dtb/bid',
            type: 'bid',
          },
        ],
      },
      {
        desc: 'not applicable with 0 resource size bid record',
        networkRecords: [

          {
            startTime: 25,
            endTime: 35,
            url: 'https://bidder.criteo.com/cdb/',
            resourceSize: 0,
          },
          {
            startTime: 30,
            endTime: 40,
            url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo',
            resourceSize: 0,
          },
        ],
        expectedNotAppl: true,
      },
      {
        desc: '1 ads and 2 bidding records with positive resource size',
        networkRecords: [
          {
            startTime: 0,
            endTime: 20,
            url: 'https://aax.amazon-adsystem.com/e/dtb/bid',
            statusCode: 200,
          },
          {
            startTime: 25,
            endTime: 35,
            url: 'https://bidder.criteo.com/cdb/',
            resourceSize: 100,
          },
          {
            startTime: 30,
            endTime: 40,
            url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo',
            resourceSize: 100,
          },
        ],
        expectedAdsRecords: [
          {
            startTime: 30000,
            endTime: 40000,
            duration: 10000,
            url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo',
            type: 'ad',
          },
        ],
        expectedHeaderBiddingRecords: [
          {
            startTime: 0,
            endTime: 20000,
            duration: 20000,
            url: 'https://aax.amazon-adsystem.com/e/dtb/bid',
            type: 'bid',
          },
          {
            startTime: 25000,
            endTime: 35000,
            duration: 10000,
            url: 'https://bidder.criteo.com/cdb/',
            type: 'bid',
          },
        ],
      },
      {
        desc: 'multiple ads and multiple bidding records',
        networkRecords: [
          {
            startTime: 10,
            endTime: 20,
            url: 'https://example.com',
            statusCode: 200,
          },
          {
            startTime: 15,
            endTime: 30,
            url: 'https://foo.uk.com',
          },
          {
            startTime: 35,
            endTime: 40,
            url: 'https://aax.amazon-adsystem.com/e/dtb/bid',
          },
          {
            startTime: 45,
            endTime: 55,
            url: 'http://contextual.media.net/bidexchange.js',
          },
          {
            startTime: 65,
            endTime: 70,
            url: 'https://securepubads.g.doubleclick.net/gampad/ads?bar',
          },
          {
            startTime: 75,
            endTime: 80,
            url: 'https://googlesyndication.com/gpt/',
          },
        ],
        expectedAdsRecords: [
          {
            startTime: 55000,
            endTime: 60000,
            duration: 5000,
            url: 'https://securepubads.g.doubleclick.net/gampad/ads?bar',
            type: 'ad',
          },
          {
            startTime: 65000,
            endTime: 70000,
            duration: 5000,
            url: 'https://googlesyndication.com/gpt/',
            type: 'ad',
          },
        ],
        expectedHeaderBiddingRecords: [
          {
            startTime: 25000,
            endTime: 30000,
            duration: 5000,
            url: 'https://aax.amazon-adsystem.com/e/dtb/bid',
            type: 'bid',
          },
          {
            startTime: 35000,
            endTime: 45000,
            duration: 10000,
            url: 'http://contextual.media.net/bidexchange.js',
            type: 'bid',
          },
        ],
      },
    ];

    for (const {desc, networkRecords, expectedAdsRecords,
      expectedHeaderBiddingRecords, expectedNotAppl} of testCases) {
      it(`should have ${desc}`, async () => {
        sandbox.stub(NetworkRecords, 'request').returns(networkRecords);
        const results = await SerialHeaderBidding.audit(
          {devtoolsLogs: {}, traces: {}}, {settings: {}});
        if (expectedNotAppl) {
          expect(results).to.have.property('notApplicable', true);
        } else {
          expect(results).with.property('extendedInfo')
              .property('adsRecords').eql(expectedAdsRecords);
          expect(results).with.property('extendedInfo')
              .property('headerBiddingRecords').eql(expectedHeaderBiddingRecords);
        }
      });
    }
  });
});
