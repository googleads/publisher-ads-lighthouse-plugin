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

const AsyncAdTags = require('../../audits/async-ad-tags');
const NetworkRecords = require('lighthouse/lighthouse-core/gather/computed/network-records');
const sinon = require('sinon');
const {expect} = require('chai');

describe('AsyncAdTags', async () => {
  let sandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('rawValue', async () => {
    const testCases = [
      {
        desc: 'should succeed if there are no ad tags',
        networkRecords: [
          {priority: 'Low', url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {priority: 'Low', url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {priority: 'Low', url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        ],
        expectedRawVal: true,
      },
      {
        desc: 'should succeed if all ad tags are async',
        networkRecords: [],
        expectedRawVal: true,
      },
      {
        desc: 'should fail unless all ad tags are async',
        networkRecords: [
          {priority: 'Low', url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {priority: 'High', url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {priority: 'Low', url: 'http://www.googletagservices.com/tag/js/gpt.js'},
          {priority: 'Low', url: 'http://www.googletagservices.com/tag/js/gpt.js'},
        ],
        expectedRawVal: false,
      },
    ];

    for (const {desc, networkRecords, expectedRawVal}
      of testCases) {
      it(`${desc}`, async () => {
        sandbox.stub(NetworkRecords, 'request').returns(networkRecords);
        const results = await AsyncAdTags.audit({devtoolsLogs: {}}, {});
        expect(results).to.have.property('rawValue', expectedRawVal);
      });
    }
  });
});
