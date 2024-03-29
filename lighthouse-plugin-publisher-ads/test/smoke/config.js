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

/**
 * Config for running lighthouse audits.
 * For the possible types, see
 * https://github.com/GoogleChrome/lighthouse/blob/master/typings/config.d.ts.
 * and
 * https://github.com/GoogleChrome/lighthouse/tree/master/core/config
 * @const {LH.Config}
 */
// TODO(jburger): Make Chrome run in headless mode.
export default {
  extends: 'lighthouse:default',
  plugins: ['lighthouse-plugin-publisher-ads'],
  passes: [
    {
      passName: 'defaultPass',
    },
  ],
  settings: {
    onlyCategories: ['lighthouse-plugin-publisher-ads'],
    // TODO(jburger): Use simulation once properly implemented.
    throttlingMethod: 'simulate',
  },
};
