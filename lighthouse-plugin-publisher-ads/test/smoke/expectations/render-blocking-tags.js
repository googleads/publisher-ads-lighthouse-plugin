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
      requestedUrl: 'http://localhost:8081/render-blocking-tags.html',
      finalUrl: 'http://localhost:8081/render-blocking-tags.html',
      audits: {
        'ad-render-blocking-resources': {
          scoreDisplayMode: 'binary',
          score: 0,
          numericValue: 2,
          details: {
            items: [
              {url: 'http://localhost:8081/no-op-style.css'},
              {url: 'http://localhost:8081/no-op-script.js'},
            ],
          },
        },
        'ad-request-critical-path': {
          scoreDisplayMode: 'informative',
          // It's important that the critical path does not include the render
          // blocking resources.
          numericValue: 3,
          details: {
            items: [
              {url: 'http://localhost:8081/slowly-inject-gpt.js'},
              {url: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js'},
              // Use a Regexp to ignore the version of pubads_impl.
              {url: /.*securepubads.g.doubleclick.net.*pubads_impl.*/},
            ],
          },
        },
      },
    },
  },
];
