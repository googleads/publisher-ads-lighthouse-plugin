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
      requestedUrl: 'http://localhost:8081/long-tasks.html',
      finalUrl: 'http://localhost:8081/long-tasks.html',
      audits: {
        'tag-load-time': {
          numericValue: '6800 +/- 1000',
        },
        'first-ad-render': {
          // TODO(jburger): Update when https://github.com/GoogleChrome/lighthouse/issues/9417 is implemented.
          numericValue: '7100 +/- 1000',
        },
        'ad-blocking-tasks': {
          score: 0,
          details: {
            items: [
              {
                script: 'http://localhost:8081/long-tasks.html',
                duration: '4025 +/- 25',
              },
            ],
          },
        },
      },
    },
  },
];
