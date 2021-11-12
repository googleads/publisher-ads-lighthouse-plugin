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
const MainResource = require('lighthouse/lighthouse-core/computed/main-resource.js');
const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records.js');
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
  describe('score', async () => {
    const testCases = [
      {
        desc: 'should succeed if all ad tags are async',
        networkRecords: [
          {priority: 'Low', url: 'http://securepubads.g.doubleclick.net/tag/js/gpt.js', frameId: 'mainFrameId'},
          {priority: 'Low', url: 'http://securepubads.g.doubleclick.net/tag/js/gpt.js', frameId: 'mainFrameId'},
        ],
        expectedScore: 1,
      },
      {
        desc: 'should ignore tags in sub-frames',
        networkRecords: [
          {priority: 'Low', url: 'http://securepubads.g.doubleclick.net/tag/js/gpt.js', frameId: 'mainFrameId'},
          {priority: 'Low', url: 'http://securepubads.g.doubleclick.net/tag/js/gpt.js', frameId: 'mainFrameId'},
        ],
        expectedScore: 1,
      },
      {
        desc: 'should succeed if there are no ad tags',
        networkRecords: [],
        expectedScore: 1,
      },
      {
        desc: 'should fail unless all ad tags are async',
        networkRecords: [
          {priority: 'Low', url: 'http://securepubads.g.doubleclick.net/tag/js/gpt.js', initiator: {type: 'script'}, frameId: 'mainFrameId'},
          {priority: 'High', url: 'http://securepubads.g.doubleclick.net/tag/js/gpt.js', initiator: {type: 'script'}, frameId: 'mainFrameId'},
          {priority: 'Low', url: 'http://securepubads.g.doubleclick.net/tag/js/gpt.js', initiator: {type: 'script'}, frameId: 'mainFrameId'},
          {priority: 'Low', url: 'http://securepubads.g.doubleclick.net/tag/js/gpt.js', initiator: {type: 'script'}, frameId: 'mainFrameId'},
        ],
        expectedScore: 0,
      },
      {
        desc: 'should assume async if loaded statically',
        networkRecords: [
          {priority: 'High', url: 'http://securepubads.g.doubleclick.net/tag/js/gpt.js', initiator: {type: 'preload'}, frameId: 'mainFrameId'},
        ],
        expectedScore: 1,
      },
    ];

    for (const {desc, networkRecords, expectedScore}
      of testCases) {
      it(`${desc}`, async () => {
        sandbox.stub(NetworkRecords, 'request').returns(networkRecords);
        sandbox.stub(MainResource, 'request').returns({frameId: 'mainFrameId'});
        const results = await AsyncAdTags.audit({devtoolsLogs: {}}, {});
        expect(results).to.have.property('score', expectedScore);
      });
    }
  });
});
