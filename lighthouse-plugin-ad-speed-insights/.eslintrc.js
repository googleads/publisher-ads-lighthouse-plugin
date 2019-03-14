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

module.exports = {
  extends: ['eslint:recommended', 'google'],
  env: {
    es6: true,
    node: true,
    mocha: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'script',
  },
  rules: {
    'indent': [
      'error', 2,
      {'MemberExpression': 2},
    ],
    'max-len': ['error', 80, {
      ignoreStrings: true,
      ignoreUrls: true,
    }],
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-body-style': ['error', 'as-needed'],
    // TODO: enable once go/github-eslint/issues/9949 is fixed
    'valid-jsdoc': 'off',
    'sort-requires/sort-requires': 2,
    'space-infix-ops': ['error', {'int32Hint': false}],
    'no-trailing-spaces': 'error',
    'no-useless-escape' : 'off',
  },
  plugins: [
    'sort-requires'
  ]
};
