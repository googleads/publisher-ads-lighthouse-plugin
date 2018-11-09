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

/**
 * Config for running lighthouse audits.
 * For the possible types, see
 * https://github.com/GoogleChrome/lighthouse/blob/master/typings/config.d.ts.
 * and
 * https://github.com/GoogleChrome/lighthouse/tree/master/lighthouse-core/config
 * @const {LH.Config}
 */
module.exports = {
  extends: 'lighthouse:full',
  passes: [
    {
      passName: 'defaultPass',
      gatherers: [
        require.resolve('./gatherers/rendered-ad-slots'),
      ],
    },
  ],

  audits: [
    require.resolve('./audits/ad-blocking-tasks'),
    require.resolve('./audits/ad-request-critical-path'),
    require.resolve('./audits/ads-in-viewport'),
    require.resolve('./audits/async-ad-tags'),
    require.resolve('./audits/loads-gpt-over-https'),
    require.resolve('./audits/static-ad-tags'),
    require.resolve('./audits/viewport-ad-density'),
    require.resolve('./audits/tag-load-time'),
    require.resolve('./audits/ad-request-from-page-start'),
    require.resolve('./audits/ad-request-from-tag-load'),
    require.resolve('./audits/full-width-slots'),
    require.resolve('./audits/ad-top-of-viewport'),
    require.resolve('./audits/duplicate-tags'),
  ],

  groups: {
    'ads-best-practices': {
      title: 'Best Practices',
    },
    'ads-performance': {
      title: 'Performance',
    },
    'measurements': {
      title: 'Measurements',
    },
  },

  categories: {
    'ads-quality': {
      title: 'Ad Quality',
      auditRefs: [
        {id: 'ad-blocking-tasks', weight: 1, group: 'ads-performance'},
        {id: 'ad-request-critical-path', weight: 1, group: 'ads-performance'},
        {id: 'ads-in-viewport', weight: 1, group: 'ads-best-practices'},
        {id: 'async-ad-tags', weight: 1, group: 'ads-best-practices'},
        {id: 'loads-gpt-over-https', weight: 1, group: 'ads-best-practices'},
        {id: 'static-ad-tags', weight: 1, group: 'ads-best-practices'},
        {id: 'viewport-ad-density', weight: 1, group: 'ads-best-practices'},
        {id: 'tag-load-time', weight: 1, group: 'measurements'},
        {id: 'ad-request-from-tag-load', weight: 1, group: 'measurements'},
        {id: 'ad-request-from-page-start', weight: 1, group: 'measurements'},
        {id: 'full-width-slots', weight: 1, group: 'ads-best-practices'},
        {id: 'ad-top-of-viewport', weight: 1, group: 'ads-best-practices'},
        {id: 'duplicate-tags', weight: 1, group: 'ads-best-practices'},
      ],
    },
  },

  settings: {
    onlyCategories: [
      'ads-quality',
    ],
  },
};
