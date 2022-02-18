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

/** @type {Array<Smokehouse.TestDfn>} */
const smokeTests = [
  // TODO(jburger): Add back `gpt-error-overall` case once fix reaches prod.
  {
    id: 'deprecated-api-usage',
    expectations: require('./expectations/deprecated-api-usage.js'),
    config: require('./config.js'),
  },
  {
    id: 'duplicate-tags',
    expectations: require('./expectations/duplicate-tags.js'),
    config: require('./config.js'),
  },
  {
    id: 'lazy-load',
    expectations: require('./expectations/lazy-load.js'),
    config: require('./config.js'),
  },
  {
    id: 'long-tasks',
    expectations: require('./expectations/long-tasks.js'),
    config: require('./config.js'),
  },
  {
    id: 'render-blocking-tasks',
    expectations: require('./expectations/render-blocking-tags.js'),
    config: require('./config.js'),
  },
  {
    id: 'script-injected',
    expectations: require('./expectations/script-injected.js'),
    config: require('./config.js'),
  },
  {
    id: 'top-of-viewport',
    expectations: require('./expectations/top-of-viewport.js'),
    config: require('./config.js'),
  },
  {
    id: 'not-applicable',
    expectations: require('./expectations/not-applicable.js'),
    config: require('./config.js'),
  },
  {
    id: 'limited-ads-dynamic-loading',
    expectations: require('./expectations/limited-ads-dynamic-loading.js'),
    config: require('./config.js'),
  },
  {
    id: 'cumulative-ad-shift',
    expectations: require('./expectations/cumulative-ad-shift.js'),
    config: require('./config.js'),
  },
];

module.exports = smokeTests;
