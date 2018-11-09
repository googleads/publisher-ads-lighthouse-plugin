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
const sinon = require('sinon');
const TagLoadTime = require('../../audits/tag-load-time');
const expect = chai.expect;
const NetworkRecords = require('lighthouse/lighthouse-core/gather/computed/network-records');

const TAG_URL = 'https://securepubads.g.doubleclick.net/gpt/pubads_impl_243.js';

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
        sandbox.stub(NetworkRecords, 'request').returns(networkRecords);
        const results = await TagLoadTime.audit({devtoolsLogs: {}}, {});
        if (!expectedNotAppl) {
          expect(results).to.have.property('rawValue', expectedLoadTime);
        } else {
          expect(results).to.have.property('notApplicable', true);
        }
      });
    }
  });
});
