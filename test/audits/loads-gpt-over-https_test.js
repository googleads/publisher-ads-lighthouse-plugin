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

const LoadsGptOverHttps = require('../../audits/loads-gpt-over-https');
const {Audit} = require('lighthouse');
const {expect} = require('chai');

describe('LoadsGptOverHttps', async () => {
  describe('numGptHttpReqs', async () => {
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
            url: 'https://www.googletagservices.com/tag/js/gpt.js',
            isSecure: true,
          },
          {
            url: 'http://www.googletagservices.com/tag/js/gpt.js#foo',
            isSecure: false,
          },
        ],
        expectedScore: 0,
        expectedNumGptHttpReqs: 1,
        expectedNumGptHttpsReqs: 1,
      },
      {
        networkRecords: [
          {
            url: 'http://example.com',
            isSecure: false,
            statusCode: 200,
          },
          {
            url: 'https://www.googletagservices.com/tag/js/gpt.js',
            isSecure: true,
          },
        ],
        expectedScore: 1,
        expectedNumGptHttpReqs: 0,
        expectedNumGptHttpsReqs: 1,
      },
      {
        networkRecords: [
          {
            url: 'http://example.com',
            isSecure: false,
            statusCode: 200,
          },
          {
            url: 'https://www.googletagservices.com/tag/js/gpt.js',
            isSecure: true,
          },
          {
            url: 'http://www.googletagservices.com/tag/js/gpt.js#foo',
            isSecure: false,
          },
        ],
        expectedScore: 0,
        expectedNumGptHttpReqs: 1,
        expectedNumGptHttpsReqs: 1,
      },
      {
        networkRecords: [
          {
            url: 'http://example.com',
            isSecure: false,
            statusCode: 200,
          },
          {
            url: 'http://www.googletagservices.com/tag/js/gpt.js',
            isSecure: false,
          },
        ],
        expectedScore: 0,
        expectedNumGptHttpReqs: 1,
        expectedNumGptHttpsReqs: 0,
      },
      {
        networkRecords: [
          {
            url: 'http://example.com',
            isSecure: false,
            statusCode: 200,
          },
          {
            url: 'http://www.googletagservices.com/tag/js/gpt.js',
            isSecure: false,
          },
          {
            url: 'http://www.googletagservices.com/tag/js/gpt.js#foo',
            isSecure: false,
          },
          {
            url: 'https://www.googletagservices.com/tag/js/gpt.js',
            isSecure: true,
          },
        ],
        expectedScore: 0,
        expectedNumGptHttpReqs: 2,
        expectedNumGptHttpsReqs: 1,
      },
      {
        networkRecords: [
          {
            url: 'http://example.com',
            isSecure: false,
            statusCode: 200,
          },
          {
            url: 'http://www.googletagservices.com/tag/js/gpt.js?foo=bar',
            isSecure: false,
          },
          {
            url: 'http://www.googletagservices.com/tag/js/gpt.js?cb=true',
            isSecure: false,
          },
          {
            url: 'http://www.googletagservices.com/tag/js/gpt.js?foo=bar#baz',
            isSecure: false,
          },
        ],
        expectedScore: 0,
        expectedNumGptHttpReqs: 3,
        expectedNumGptHttpsReqs: 0,
      },
    ];
    for (const {networkRecords, expectedScore, expectedNotAppl,
      expectedNumGptHttpReqs, expectedNumGptHttpsReqs} of testCases) {
      it(`should have a score of ${expectedScore} with` +
        ` ${expectedNumGptHttpReqs} HTTP requests and` +
        ` ${expectedNumGptHttpsReqs} HTTPS requests`, async () => {
        const results = await LoadsGptOverHttps.audit({
          devtoolsLogs: {[Audit.DEFAULT_PASS]: []},
          requestNetworkRecords: () => Promise.resolve(networkRecords),
        });
        if (expectedNotAppl) {
          expect(results).to.have.property('notApplicable', true);
        } else {
          expect(results).to.have.property('score', expectedScore);
          expect(results).with.property('details')
              .property('numGptHttpReqs').equal(expectedNumGptHttpReqs);
          expect(results).with.property('details')
              .property('numGptHttpsReqs').equal(expectedNumGptHttpsReqs);
        }
      });
    }
  });

  describe('numGptHttpsReqs', async () => {
    const testCases = [
      {
        networkRecords: [],
        expectedNumGptHttpReqs: 0,
        expectedNumGptHttpsReqs: 0,
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
            url: 'http://www.googletagservices.com/tag/js/gpt.js',
            isSecure: false,
          },
        ],
        expectedScore: 0,
        expectedNumGptHttpReqs: 1,
        expectedNumGptHttpsReqs: 0,
      },
      {
        networkRecords: [
          {
            url: 'http://example.com',
            isSecure: false,
            statusCode: 200,
          },
          {
            url: 'https://www.googletagservices.com/tag/js/gpt.js',
            isSecure: true,
          },
          {
            url: 'https://www.googletagservices.com/tag/js/gpt.js?foo=bar',
            isSecure: true,
          },
          {
            url: 'http://www.googletagservices.com/tag/js/gpt.js#foo',
            isSecure: false,
          },
        ],
        expectedScore: 0,
        expectedNumGptHttpReqs: 1,
        expectedNumGptHttpsReqs: 2,
      },
      {
        networkRecords: [
          {
            url: 'http://example.com',
            isSecure: false,
            statusCode: 200,
          },
          {
            url: 'https://www.googletagservices.com/tag/js/gpt.js',
            isSecure: true,
          },
        ],
        expectedScore: 1,
        expectedNumGptHttpReqs: 0,
        expectedNumGptHttpsReqs: 1,
      },
      {
        networkRecords: [
          {
            url: 'http://example.com',
            isSecure: false,
            statusCode: 200,
          },
          {
            url: 'https://www.googletagservices.com/tag/js/gpt.js',
            isSecure: true,
          },
          {
            url: 'https://www.googletagservices.com/tag/js/gpt.js#foo',
            isSecure: true,
          },
        ],
        expectedScore: 1,
        expectedNumGptHttpReqs: 0,
        expectedNumGptHttpsReqs: 2,
      },
      {
        networkRecords: [
          {
            url: 'http://example.com',
            isSecure: false,
            statusCode: 200,
          },
          {
            url: 'https://www.googletagservices.com/tag/js/gpt.js?foo=bar',
            isSecure: true,
          },
          {
            url: 'https://www.googletagservices.com/tag/js/gpt.js?cb=true',
            isSecure: true,
          },
          {
            url: 'https://www.googletagservices.com/tag/js/gpt.js?foo=bar#baz',
            isSecure: true,
          },
        ],
        expectedScore: 1,
        expectedNumGptHttpReqs: 0,
        expectedNumGptHttpsReqs: 3,
      },
    ];
    for (const {networkRecords, expectedScore, expectedNotAppl,
      expectedNumGptHttpReqs, expectedNumGptHttpsReqs} of testCases) {
      it(`should have a score of ${expectedScore} with` +
        ` ${expectedNumGptHttpReqs} HTTP requests and` +
        ` ${expectedNumGptHttpsReqs} HTTPS requests`, async () => {
        const results = await LoadsGptOverHttps.audit({
          devtoolsLogs: {[Audit.DEFAULT_PASS]: []},
          requestNetworkRecords: () => Promise.resolve(networkRecords),
        });
        if (expectedNotAppl) {
          expect(results).to.have.property('notApplicable', true);
        } else {
          expect(results).to.have.property('score', expectedScore);
          expect(results).with.property('details')
              .property('numGptHttpReqs').equal(expectedNumGptHttpReqs);
          expect(results).with.property('details')
              .property('numGptHttpsReqs').equal(expectedNumGptHttpsReqs);
        }
      });
    }
  });
});
