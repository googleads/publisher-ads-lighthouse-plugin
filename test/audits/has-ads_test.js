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

const HasAds = require('../../audits/has-ads');
const {Audit} = require('lighthouse');
const {expect} = require('chai');

describe('HasAds', async () => {
  describe('numRequests', async () => {
    const testCases = [
      {
        description: 'empty logs',
        networkRecords: [],
        expectedScore: 0,
        expectedNumRequests: 0,
      },
      {
        description: 'logs without requests',
        networkRecords: [
          {url: 'http://example.com'},
          {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
        ],
        expectedScore: 0,
        expectedNumRequests: 0,
      },
      {
        description: 'logs with single request',
        networkRecords: [
          {url: 'http://example.com'},
          {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
          {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
        ],
        expectedScore: 1,
        expectedNumRequests: 1,
      },
      {
        description: 'log with only one request record',
        networkRecords: [
          {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
        ],
        expectedScore: 1,
        expectedNumRequests: 1,
      },
      {
        description: 'empty logs',
        networkRecords: [
          {url: 'http://example.com'},
          {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
          {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
          {url: 'https://securepubads.g.doubleclick.net/other'},
          {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
          {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
        ],
        expectedScore: 1,
        expectedNumRequests: 3,
      },
    ];
    for (const {description, networkRecords,
      expectedScore, expectedNumRequests} of testCases) {
      it(`should have score of ${expectedScore} for ${description} with` +
        ` ${expectedNumRequests} requests`, async () => {
        const results = await HasAds.audit({
          devtoolsLogs: {[Audit.DEFAULT_PASS]: []},
          requestNetworkRecords: () => Promise.resolve(networkRecords),
        });
        expect(results).with.property('score', expectedScore);
        expect(results).with.property('details').property('numRequests')
            .equal(expectedNumRequests);
      });
    }
  });

  describe('numImpressions', async () => {
    const testCases = [
      {
        description: 'empty logs',
        networkRecords: [],
        expectedScore: 0,
        expectedImpressions: 0,
      },
      {
        description: 'non-empty logs',
        networkRecords: [
          {url: 'http://example.com'},
          {url: 'https://securepubads.g.doubleclick.net/other'},
        ],
        expectedScore: 0,
        expectedImpressions: 0,
      },
      {
        description: 'logs with single impression',
        networkRecords: [
          {url: 'http://example.com'},
          {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
          {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
          {url: 'https://googlesyndication.com/pcs/view?bar=baz'},
        ],
        expectedScore: 1,
        expectedImpressions: 1,
      },
      {
        description: 'logs with multiple impressions',
        networkRecords: [
          {url: 'http://example.com'},
          {url: 'https://securepubads.g.doubleclick.net/gpt/js/pubads.js'},
          {url: 'https://securepubads.g.doubleclick.net/gampad/ads?foo'},
          {url: 'https://googlesyndication.com/pcs/view?bar=baz'},
          {url: 'https://googlesyndication.com/pagead/adview?bar=baz'},
        ],
        expectedScore: 1,
        expectedImpressions: 2,
      },
    ];
    for (const {description, networkRecords,
      expectedScore, expectedImpressions} of testCases) {
      it(`should have score of ${expectedScore} for ${description} with` +
        ` ${expectedImpressions} impressions`, async () => {
        const results = await HasAds.audit({
          devtoolsLogs: {[Audit.DEFAULT_PASS]: []},
          requestNetworkRecords: () => Promise.resolve(networkRecords),
        });
        expect(results).with.property('score', expectedScore);
        expect(results).with.property('details').property('numImpressions')
            .equal(expectedImpressions);
      });
    }
  });
});
