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

import deprecatedApiUsage from './expectations/deprecated-api-usage.js';
import duplicateTags from './expectations/duplicate-tags.js';
import lazyLoad from './expectations/lazy-load.js';
import longTasks from './expectations/long-tasks.js';
import renderBlockingTags from './expectations/render-blocking-tags.js';
import scriptInjected from './expectations/script-injected.js';
import topOfViewport from './expectations/top-of-viewport.js';
import notApplicable from './expectations/not-applicable.js';
import limitedAdsDynamicLoading from './expectations/limited-ads-dynamic-loading.js';
import cumulativeAdShift from './expectations/cumulative-ad-shift.js';
import config from './config.js';

/** @type {Array<Smokehouse.TestDfn>} */
const smokeTests = [
  // TODO(jburger): Add back `gpt-error-overall` case once fix reaches prod.
  {
    id: 'deprecated-api-usage',
    expectations: deprecatedApiUsage,
    config,
  },
  {
    id: 'duplicate-tags',
    expectations: duplicateTags,
    config,
  },
  {
    id: 'lazy-load',
    expectations: lazyLoad,
    config,
  },
  {
    id: 'long-tasks',
    expectations: longTasks,
    config,
  },
  {
    id: 'render-blocking-tasks',
    expectations: renderBlockingTags,
    config,
  },
  {
    id: 'script-injected',
    expectations: scriptInjected,
    config,
  },
  {
    id: 'top-of-viewport',
    expectations: topOfViewport,
    config,
  },
  {
    id: 'not-applicable',
    expectations: notApplicable,
    config,
  },
  {
    id: 'limited-ads-dynamic-loading',
    expectations: limitedAdsDynamicLoading,
    config,
  },
  {
    id: 'cumulative-ad-shift',
    expectations: cumulativeAdShift,
    config,
  },
];

export default smokeTests;
