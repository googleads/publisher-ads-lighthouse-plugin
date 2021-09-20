// Copyright 2019 Google LLC
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
//
//
const network = require('../../utils/network');
const {expect} = require('chai');

describe('utils/network', () => {
  describe('isCacheable', () => {
    const testCases = [
      {
        resourceType: 'XHR',
        cacheControl: 'public, max-age=20000',
        expectation: false,
      },
      {
        resourceType: 'Script',
        cacheControl: 'public, max-age=20000',
        expectation: true,
      },
      {
        resourceType: 'Script',
        cacheControl: 'public, max-age=0',
        expectation: false,
      },
      {
        resourceType: 'Script',
        cacheControl: 'no-cache',
        expectation: false,
      },
      {
        resourceType: 'Script',
        cacheControl: 'no-store',
        expectation: false,
      },
      {
        resourceType: 'Script',
        cacheControl: 'public',
        expectation: true,
      },
    ];
    for (const {resourceType, cacheControl, expectation} of testCases) {
      const headerNames = ['cache-control', 'cache-Control', 'CACHE-CONTROL'];
      for (const name of headerNames) {
        it(`should return ${expectation} for resource type ${resourceType} `
            + `with cache-control=${cacheControl}`, () => {
          const record = {
            statusCode: 200,
            resourceType,
            responseHeaders: [{name, value: cacheControl}],
            protocol: 'https:',
            parsedURL: {
              scheme: 'https:',
            },
          };
          expect(network.isCacheable(record)).to.equal(expectation);
        });
      }
    }

    it('should return false with no cache-control header', () => {
      const record = {
        statusCode: 200,
        resourceType: 'Script',
        protocol: 'https',
        parsedURL: {
          scheme: 'https:',
        },
      };
      expect(network.isCacheable(record)).to.equal(false);
    });
  });
});
