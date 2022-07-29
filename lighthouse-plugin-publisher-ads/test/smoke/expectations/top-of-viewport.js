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
      requestedUrl: 'http://localhost:8081/top-of-viewport.html',
      finalUrl: 'http://localhost:8081/top-of-viewport.html',
      audits: {
        'ad-top-of-viewport': {
          score: 0,
          numericValue: 53,
          details: {
            // .../Travel_0 should be ignored as it is fixed.
            items: [
              {
                slot: 'google_ads_iframe_/6355419/Travel_1',
              },
            ],
          },
        },
      },
    },
  },
];
