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

const networkRecords = [
  {
    url: 'https://example.com',
    statusCode: 200,
    startTime: 0,
  },
  {
    url: 'https://example.com/script/index.js',
    startTime: 1,
    endTime: 2,
    initiator: {
      type: 'parser',
    },
  },
  {
    url: 'https://test.com/script/test.js',
    startTime: 1,
    endTime: 2,
    initiator: {
      type: 'parser',
    },
  },
  {
    url: 'https://quiz.com/script/example.js',
    startTime: 1,
    endTime: 2,
    initiator: {
      type: 'parser',
    },
  },
];

export default networkRecords;
