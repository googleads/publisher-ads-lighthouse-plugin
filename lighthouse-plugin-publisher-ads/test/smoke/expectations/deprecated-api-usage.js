// Copyright 2021 Google LLC
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
'use strict';

/**
 * Expected Lighthouse audit values for perf tests.
 */
export default [
  {
    lhr: {
      requestedUrl: 'http://localhost:8081/deprecated-api-usage.html',
      finalUrl: 'http://localhost:8081/deprecated-api-usage.html',
      audits: {
        'deprecated-gpt-api-usage': {
          score: null,
          details: {
            items: [
              {
                source: 'console.warn',
                description: 'The googletag.pubads().definePassback ' +
                'function has been deprecated. The function may break in ' +
                'certain contexts, see ' +
                'https://developers.google.com/publisher-tag/guides/passback-tags#construct_passback_tags ' +
                'for how to correctly create a passback.',
                // Use a Regexp to ignore the version of pubads_impl.
                url: /.*securepubads.g.doubleclick.net.*pubads_impl.*/,
              },
            ],
          },
        },
      },
    },
  },
];
