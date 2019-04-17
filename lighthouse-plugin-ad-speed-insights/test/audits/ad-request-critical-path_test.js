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

const AdRequestCriticalPath = require('../../audits/ad-request-critical-path');
const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records');
const sinon = require('sinon');
const {expect} = require('chai');

describe('AdRequestCriticalPath', async () => {
  let sandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });
  const testCases = [
    {
      filePath: './network-records-test-files/non-ads-entries',
      desc: 'non-ads entries',
      expectedRawValue: true,
      expectedNotAppl: true,
    },
    {
      filePath: './network-records-test-files/non-script-entries',
      desc: 'non-script entries',
      expectedRawValue: true,
      expectedNotAppl: true,
    },
    {
      filePath: './network-records-test-files/ads-related-entry',
      desc: 'ads-related entry',
      expectedScore: 1,
      expectedRawValue: 0,
    },
    {
      filePath: './network-records-test-files/multiple-entries',
      desc: 'multiple blocking entries',
      expectedScore: 0,
      expectedRawValue: 1,
    },
    {
      filePath: './network-records-test-files/multiple-dependencies',
      desc: 'multiple dependencies',
      expectedScore: 0,
      expectedRawValue: 2,
    },
    {
      filePath: './network-records-test-files/blank-initiator-details',
      desc: 'blank initiator details entry',
      expectedScore: 1,
      expectedRawValue: 0,
    },
    {
      filePath: './network-records-test-files/diamond-dependency',
      desc: 'diamond dependency structure',
      expectedScore: 1,
      expectedRawValue: 4,
    },
    {
      filePath: './network-records-test-files/multiple-pubads-single',
      desc: 'multiple pubads function calls on stack',
      expectedScore: 0,
      expectedRawValue: 4,
    },
    {
      filePath: './network-records-test-files/cycle',
      desc: 'a cycle in the stack',
      expectedScore: 0,
      expectedRawValue: 7,
    },
    {
      filePath: './network-records-test-files/not-in-graph',
      desc: 'an entry but has a call frame that is not in the dependency graph',
      expectedScore: 1,
      expectedRawValue: 0,
    },
    {
      filePath: './network-records-test-files/multiple-pubads-entries',
      desc: 'multiple pubads function calls in callFrames array',
      expectedScore: 1,
      expectedRawValue: 4,
    },
  ];
  for (const {filePath, desc, expectedScore, expectedRawValue,
    expectedNotAppl} of testCases) {
    it(`should return ${expectedScore} for ${desc} w/ raw value ` +
        `${expectedRawValue}`, async () => {
      const networkRecords = require(filePath);
      sandbox.stub(NetworkRecords, 'request').returns(networkRecords);
      const results = await AdRequestCriticalPath.audit({
        devtoolsLogs: {},
        Scripts: [],
      }, {});
      expect(results).to.have.property('rawValue', expectedRawValue);
      if (expectedNotAppl) {
        expect(results).to.have.property('notApplicable', true);
      } else {
        expect(results).to.have.property('score', expectedScore);
      }
    });
  }
});

describe('CriticalPathTreeGeneration', async () => {
  let sandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });
  const testCases = [
    {
      filePath: './network-records-test-files/multiple-entries',
      desc: 'multiple entries',
      expectedTree: {
        name: 'https://doubleclick.net/gampad/ads',
        children: [
          {
            name: 'https://securepubads.g.doubleclick.net/gpt/pubads_impl_216.js',
            children: [
              {
                name: 'https://www.googletagservices.com/tag/js/gpt.js',
                children: [
                  {
                    name: 'https://securepubads.g.doubleclick.net/gpt/foo.js',
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
    {
      filePath: './network-records-test-files/diamond-dependency',
      desc: 'diamond dependency',
      expectedTree: {
        name: 'https://doubleclick.net/gampad/ads',
        children: [
          {
            name: 'https://securepubads.g.doubleclick.net/gpt/pubads_impl_216.js',
            children: [
              {
                name: 'https://www.googletagservices.com/tag/js/gpt.js',
                children: [
                  {
                    name: 'https://securepubads.g.doubleclick.net/gpt/foo.js',
                    children: [],
                  },
                ],
              },
            ],
          },
          {
            name: 'https://googlesyndication.com/gpt/bar.js',
            children: [
              {
                name: 'https://securepubads.g.doubleclick.net/gpt/foo.js',
                children: [],
              },
            ],
          },
        ],
      },
    },
    {
      filePath: './network-records-test-files/non-ads-entries',
      desc: 'non ads entries',
      expectedNotAppl: true,
    },
    {
      filePath: './network-records-test-files/multiple-pubads-single',
      desc: ' > 1 children',
      expectedTree: {
        name: 'https://doubleclick.net/gampad/ads',
        children: [
          {
            name: 'https://securepubads.g.doubleclick.net/gpt/pubads_impl_216.js',
            children: [
              {
                name: 'https://www.googletagservices.com/tag/js/gpt.js',
                children: [{name: 'https://securepubads.g.doubleclick.net/gpt/foo.js', children: []}]}],
          },
        ],
      },
    },
    {
      filePath: './network-records-test-files/multiple-pubads-entries',
      desc: 'duplicate urls',
      expectedTree: {
        name: 'https://doubleclick.net/gampad/ads',
        children: [
          {
            name: 'https://securepubads.g.doubleclick.net/gpt/pubads_impl_216.js',
            children: [
              {
                name: 'https://www.googletagservices.com/tag/js/gpt.js',
                children: [
                  {
                    name: 'https://securepubads.g.doubleclick.net/gpt/foo.js',
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
    {
      filePath: './network-records-test-files/cycle',
      desc: 'cycle in tree',
      expectedTree: {
        name: 'https://doubleclick.net/gampad/ads',
        children: [
          {
            name: 'https://securepubads.g.doubleclick.net/gpt/pubads_impl_216.js',
            children: [
              {
                name: 'https://www.googletagservices.com/tag/js/gpt.js',
                children: [
                  {
                    name: 'https://securepubads.g.doubleclick.net/gpt/foo.js',
                    children: [],
                  },
                  {
                    name: 'https://securepubads.g.doubleclick.net/gpt/bar.js',
                    children: [
                      {
                        name: 'https://securepubads.g.doubleclick.net/gpt/bat.js',
                        children: [
                          {
                            name: 'https://securepubads.g.doubleclick.net/gpt/baz.js',
                            children: [
                              {
                                name: 'https://securepubads.g.doubleclick.net/gpt/bat.js',
                                children: [],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  ];
  for (const {filePath, desc, expectedTree, expectedNotAppl} of testCases) {
    it(`should pass for ${desc}`, async () => {
      const networkRecords = require(filePath);
      sandbox.stub(NetworkRecords, 'request').returns(networkRecords);
      const results = await AdRequestCriticalPath.audit({
        Scripts: [],
        devtoolsLogs: {},
      }, {});

      if (expectedNotAppl) {
        expect(results).to.have.property('notApplicable', true);
      } else {
        // expect(results);
      }
    });
  }
});
