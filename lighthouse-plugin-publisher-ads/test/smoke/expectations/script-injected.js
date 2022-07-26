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
'use strict';

/**
 * Expected Lighthouse audit values for perf tests.
 */
export default [
  {
    lhr: {
      requestedUrl: 'http://localhost:8081/script-injected.html',
      finalUrl: 'http://localhost:8081/script-injected.html',
      audits: {
        'script-injected-tags': {
          score: 0,
          details: {
            items: [
              {
                url: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js',
              },
            ],
          },
        },
        'loads-ad-tag-over-https': {
          score: 1,
          details: {
            numAdTagHttpsReqs: 1,
            numAdTagHttpReqs: 0,
          },
        },
        'ad-blocking-tasks': {
          score: 0,
          details: {
            items: [
              {
                script: 'http://localhost:8081/slowly-inject-gpt.js',
                duration: '4050 +/- 50',
              },
            ],
          },
        },
        // TODO(jburger): Update test to include useful coverage for this audit.
        'bottleneck-requests': {
          score: 1,
          details: {
            items: [],
          },
        },
      },
    },
  },
];
