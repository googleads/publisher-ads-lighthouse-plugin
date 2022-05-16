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

const LoadsAdTagOverHttps = require('../../audits/loads-ad-tag-over-https');
const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records.js');
const sinon = require('sinon');
const {expect} = require('chai');

describe('LoadsAdTagOverHttps', async () => {
  let sandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('numAdTagHttpReqs', async () => {
    const testCases = [
      {
        networkRecords: [],
        expectedNotAppl: true,
      },
      {
        networkRecords: [
          {
            url: 'https://example.com',
            isSecure: true,
            statusCode: 200,
          },
          {
            url: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js',
            isSecure: true,
          },
          {
            url: 'http://securepubads.g.doubleclick.net/tag/js/gpt.js#foo',
            isSecure: false,
          },
        ],
        expectedScore: 0,
        expectedNumAdTagHttpReqs: 1,
        expectedNumAdTagHttpsReqs: 1,
      },
      {
        networkRecords: [
          {
            url: 'http://example.com',
            isSecure: false,
            statusCode: 200,
          },
          {
            url: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js',
            isSecure: true,
          },
        ],
        expectedScore: 1,
        expectedNumAdTagHttpReqs: 0,
        expectedNumAdTagHttpsReqs: 1,
      },
      {
        networkRecords: [
          {
            url: 'http://example.com',
            isSecure: false,
            statusCode: 200,
          },
          {
            url: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js',
            isSecure: true,
          },
          {
            url: 'http://securepubads.g.doubleclick.net/tag/js/gpt.js#foo',
            isSecure: false,
          },
        ],
        expectedScore: 0,
        expectedNumAdTagHttpReqs: 1,
        expectedNumAdTagHttpsReqs: 1,
      },
      {
        networkRecords: [
          {
            url: 'http://example.com',
            isSecure: false,
            statusCode: 200,
          },
          {
            url: 'http://securepubads.g.doubleclick.net/tag/js/gpt.js',
            isSecure: false,
          },
        ],
        expectedScore: 0,
        expectedNumAdTagHttpReqs: 1,
        expectedNumAdTagHttpsReqs: 0,
      },
      {
        networkRecords: [
          {
            url: 'http://example.com',
            isSecure: false,
            statusCode: 200,
          },
          {
            url: 'http://securepubads.g.doubleclick.net/tag/js/gpt.js',
            isSecure: false,
          },
          {
            url: 'http://securepubads.g.doubleclick.net/tag/js/gpt.js#foo',
            isSecure: false,
          },
          {
            url: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js',
            isSecure: true,
          },
        ],
        expectedScore: 0,
        expectedNumAdTagHttpReqs: 2,
        expectedNumAdTagHttpsReqs: 1,
      },
      {
        networkRecords: [
          {
            url: 'http://example.com',
            isSecure: false,
            statusCode: 200,
          },
          {
            url: 'http://securepubads.g.doubleclick.net/tag/js/gpt.js?foo=bar',
            isSecure: false,
          },
          {
            url: 'http://securepubads.g.doubleclick.net/tag/js/gpt.js?cb=true',
            isSecure: false,
          },
          {
            url: 'http://securepubads.g.doubleclick.net/tag/js/gpt.js?foo=bar#baz',
            isSecure: false,
          },
        ],
        expectedScore: 0,
        expectedNumAdTagHttpReqs: 3,
        expectedNumAdTagHttpsReqs: 0,
      },
      {
        networkRecords: [
          {
            url: 'https://example.com',
            isSecure: true,
            statusCode: 200,
          },
          {
            url: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
            isSecure: true,
          },
          {
            url: 'http://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js#foo',
            isSecure: false,
          },
        ],
        expectedScore: 0,
        expectedNumAdTagHttpReqs: 1,
        expectedNumAdTagHttpsReqs: 1,
      },
    ];
    for (const {networkRecords, expectedScore, expectedNotAppl,
      expectedNumAdTagHttpReqs, expectedNumAdTagHttpsReqs} of testCases) {
      it(`should have a score of ${expectedScore} with` +
        ` ${expectedNumAdTagHttpReqs} HTTP requests and` +
        ` ${expectedNumAdTagHttpsReqs} HTTPS requests`, async () => {
        sandbox.stub(NetworkRecords, 'request').returns(networkRecords);
        const results = await LoadsAdTagOverHttps.audit({devtoolsLogs: {}}, {});
        if (expectedNotAppl) {
          expect(results).to.have.property('notApplicable', true);
        } else {
          expect(results).to.have.property('score', expectedScore);
          expect(results).with.property('details')
              .property('numAdTagHttpReqs').equal(expectedNumAdTagHttpReqs);
          expect(results).with.property('details')
              .property('numAdTagHttpsReqs').equal(expectedNumAdTagHttpsReqs);
        }
      });
    }
  });

  describe('numAdTagHttpsReqs', async () => {
    const testCases = [
      {
        networkRecords: [],
        expectedNumAdTagHttpReqs: 0,
        expectedNumAdTagHttpsReqs: 0,
        expectedNotAppl: true,
      },
      {
        networkRecords: [
          {
            url: 'http://example.com',
            isSecure: false,
            statusCode: 200,
          },
          {
            url: 'http://securepubads.g.doubleclick.net/tag/js/gpt.js',
            isSecure: false,
          },
        ],
        expectedScore: 0,
        expectedNumAdTagHttpReqs: 1,
        expectedNumAdTagHttpsReqs: 0,
      },
      {
        networkRecords: [
          {
            url: 'http://example.com',
            isSecure: false,
            statusCode: 200,
          },
          {
            url: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js',
            isSecure: true,
          },
          {
            url: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js?foo=bar',
            isSecure: true,
          },
          {
            url: 'http://securepubads.g.doubleclick.net/tag/js/gpt.js#foo',
            isSecure: false,
          },
        ],
        expectedScore: 0,
        expectedNumAdTagHttpReqs: 1,
        expectedNumAdTagHttpsReqs: 2,
      },
      {
        networkRecords: [
          {
            url: 'http://example.com',
            isSecure: false,
            statusCode: 200,
          },
          {
            url: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js',
            isSecure: true,
          },
        ],
        expectedScore: 1,
        expectedNumAdTagHttpReqs: 0,
        expectedNumAdTagHttpsReqs: 1,
      },
      {
        networkRecords: [
          {
            url: 'http://example.com',
            isSecure: false,
            statusCode: 200,
          },
          {
            url: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js',
            isSecure: true,
          },
          {
            url: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js#foo',
            isSecure: true,
          },
        ],
        expectedScore: 1,
        expectedNumAdTagHttpReqs: 0,
        expectedNumAdTagHttpsReqs: 2,
      },
      {
        networkRecords: [
          {
            url: 'http://example.com',
            isSecure: false,
            statusCode: 200,
          },
          {
            url: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js?foo=bar',
            isSecure: true,
          },
          {
            url: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js?cb=true',
            isSecure: true,
          },
          {
            url: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js?foo=bar#baz',
            isSecure: true,
          },
        ],
        expectedScore: 1,
        expectedNumAdTagHttpReqs: 0,
        expectedNumAdTagHttpsReqs: 3,
      },
      {
        networkRecords: [
          {
            url: 'http://example.com',
            isSecure: false,
            statusCode: 200,
          },
          {
            url: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
            isSecure: true,
          },
          {
            url: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?foo=bar',
            isSecure: true,
          },
          {
            url: 'http://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js#foo',
            isSecure: false,
          },
        ],
        expectedScore: 0,
        expectedNumAdTagHttpReqs: 1,
        expectedNumAdTagHttpsReqs: 2,
      },
    ];
    for (const {networkRecords, expectedScore, expectedNotAppl,
      expectedNumAdTagHttpReqs, expectedNumAdTagHttpsReqs} of testCases) {
      it(`should have a score of ${expectedScore} with` +
        ` ${expectedNumAdTagHttpReqs} HTTP requests and` +
        ` ${expectedNumAdTagHttpsReqs} HTTPS requests`, async () => {
        sandbox.stub(NetworkRecords, 'request').returns(networkRecords);
        const results = await LoadsAdTagOverHttps.audit({devtoolsLogs: {}}, {});
        if (expectedNotAppl) {
          expect(results).to.have.property('notApplicable', true);
        } else {
          expect(results).to.have.property('score', expectedScore);
          expect(results).with.property('details')
              .property('numAdTagHttpReqs').equal(expectedNumAdTagHttpReqs);
          expect(results).with.property('details')
              .property('numAdTagHttpsReqs').equal(expectedNumAdTagHttpsReqs);
        }
      });
    }
  });
});
