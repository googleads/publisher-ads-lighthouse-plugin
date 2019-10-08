/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/**
 * Expected Lighthouse audit values for perf tests.
 */
module.exports = [
  {
    lhr: {
      requestedUrl: 'http://localhost:8081/long-tasks.html',
      finalUrl: 'http://localhost:8081/long-tasks.html',
      audits: {
        'tag-load-time': {
          numericValue: '>3',
          numericValue: '<3.5'
        },
        'first-ad-render': {
            // TODO(jburger): Update when https://github.com/GoogleChrome/lighthouse/issues/9417 is implemented.
            numericValue: '>3.5',
            numericValue: '<4.5'
        },
        'loads-gpt-from-sgdn': {
          score: 0,
        },
        'ad-blocking-tasks': {
          score: 0,
          details: {
            items: [
              {
                script: 'http://localhost:8081/long-tasks.html',
                duration: '>=1000',
                duration: '<1010',
              },
            ],
          },
        },
      },
    },
  },
  // {
  //   lhr: {
  //     requestedUrl: 'http://localhost:8081/script-injected.html',
  //     finalUrl: 'http://localhost:8081/script-injected.html',
  //     audits: {
  //       'script-injected-tags': {
  //         score: 0,
  //         details: {
  //           items: [
  //             {
  //               url: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js',
  //             },
  //           ],
  //         },
  //       },
  //     },
  //   },
  // },
  // {
  //   lhr: {
  //     requestedUrl: 'http://localhost:8081/lazy-load.html',
  //     finalUrl: 'http://localhost:8081/lazy-load.html',
  //     audits: {
  //       'ad-top-of-viewport': {
  //         score: 0,
  //         numericValue: 53,
  //         details: {
  //           items: [
  //             {
  //               slot: 'google_ads_iframe_/6355419/Travel_0',
  //             },
  //           ],
  //         },
  //       },
  //       'viewport-ad-density': {
  //         score: 0,
  //         numericValue: '>.45',
  //         numericValue: '<.46',
  //       },
  //       'ads-in-viewport': {
  //         score: 0,
  //         numericValue: .6,
  //         details: {
  //           items: [
  //             {slot: 'google_ads_iframe_/6355419/Travel_6'},
  //             {slot: 'google_ads_iframe_/6355419/Travel_7'},
  //             {slot: 'google_ads_iframe_/6355419/Travel_8'},
  //             {slot: 'google_ads_iframe_/6355419/Travel_9'},
  //           ],
  //         },
  //       },
  //     },
  //   },
  // },
  // {
  //   lhr: {
  //     requestedUrl: 'http://localhost:8081/top-of-viewport.html',
  //     finalUrl: 'http://localhost:8081/top-of-viewport.html',
  //     audits: {
  //       'ad-top-of-viewport': {
  //         score: 0,
  //         numericValue: 53,
  //         details: {
  //           // .../Travel_0 should be ignored as it is fixed.
  //           items: [
  //             {
  //               slot: 'google_ads_iframe_/6355419/Travel_1',
  //             },
  //           ],
  //         },
  //       },
  //     },
  //   },
  // },
];
