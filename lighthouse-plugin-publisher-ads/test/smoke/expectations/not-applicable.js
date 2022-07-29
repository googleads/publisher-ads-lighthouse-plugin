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
      requestedUrl: 'http://localhost:8081/not-applicable.html',
      finalUrl: 'http://localhost:8081/not-applicable.html',
      runWarnings: [
        'No ads were requested when fetching this page.',
        'No ads were rendered when rendering this page.',
        'The GPT tag was not requested.',
      ],
      audits: {
        'ad-blocking-tasks': {scoreDisplayMode: 'notApplicable'},
        'ad-render-blocking-resources': {scoreDisplayMode: 'notApplicable'},
        'ad-request-critical-path': {scoreDisplayMode: 'notApplicable'},
        'bid-request-from-page-start': {scoreDisplayMode: 'notApplicable'},
        'ad-request-from-page-start': {scoreDisplayMode: 'notApplicable'},
        'ad-top-of-viewport': {scoreDisplayMode: 'notApplicable'},
        'ads-in-viewport': {scoreDisplayMode: 'notApplicable'},
        'async-ad-tags': {scoreDisplayMode: 'notApplicable'},
        'blocking-load-events': {scoreDisplayMode: 'notApplicable'},
        'bottleneck-requests': {scoreDisplayMode: 'notApplicable'},
        'duplicate-tags': {scoreDisplayMode: 'notApplicable'},
        'first-ad-render': {scoreDisplayMode: 'notApplicable'},
        'gpt-bids-parallel': {scoreDisplayMode: 'notApplicable'},
        'loads-ad-tag-over-https': {scoreDisplayMode: 'notApplicable'},
        'loads-gpt-from-official-source': {scoreDisplayMode: 'notApplicable'},
        'script-injected-tags': {scoreDisplayMode: 'notApplicable'},
        'serial-header-bidding': {scoreDisplayMode: 'notApplicable'},
        'tag-load-time': {scoreDisplayMode: 'notApplicable'},
        'total-ad-blocking-time': {scoreDisplayMode: 'notApplicable'},
        'viewport-ad-density': {scoreDisplayMode: 'notApplicable'},
        'gpt-errors-overall': {scoreDisplayMode: 'notApplicable'},
        'deprecated-gpt-api-usage': {scoreDisplayMode: 'notApplicable'},
      },
    },
  },
];
