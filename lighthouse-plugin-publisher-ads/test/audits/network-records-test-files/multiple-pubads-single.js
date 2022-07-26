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
  // Filtered out ad request.
  {
    url: 'https://doubleclick.net/gampad/ads',
    startTime: 3,
    initiator: {
      type: 'script',
      stack: {
        callFrames: [
          {
            functionName: 'us',
            scriptId: '56',
            url: 'https://securepubads.g.doubleclick.net/gpt/pubads_impl_216.js',
            lineNumber: '0',
            columnNumber: '126445',
          },
        ],
      },
    },
  },
  // Filtered out GPT implementation script.
  {
    url: 'https://securepubads.g.doubleclick.net/gpt/pubads_impl_216.js',
    startTime: 1,
    endTime: 2,
    initiator: {
      type: 'script',
      stack: {
        callFrames: [
          {
            functionName: 'us',
            scriptId: '56',
            url: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js',
            lineNumber: '0',
            columnNumber: '126445',
          },
        ],
      },
    },
  },
  // Filtered out GPT implementation script.
  {
    url: 'https://securepubads.g.doubleclick.net/gpt/pubads_impl_216.js',
    startTime: 1,
    endTime: 2,
    initiator: {
      type: 'script',
      stack: {
        callFrames: [
          {
            functionName: 'us',
            scriptId: '56',
            url: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js',
            lineNumber: '0',
            columnNumber: '126445',
          },
        ],
      },
    },
  },
  // Filtered out GPT implementation script.
  {
    url: 'https://securepubads.g.doubleclick.net/gpt/pubads_impl_216.js',
    startTime: 1,
    endTime: 2,
    initiator: {
      type: 'script',
      stack: {
        callFrames: [
          {
            functionName: 'us',
            scriptId: '56',
            url: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js',
            lineNumber: '0',
            columnNumber: '126445',
          },
        ],
      },
    },
  },
  // Filtered out GPT loader script.
  {
    url: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js',
    startTime: 1,
    endTime: 2,
    initiator: {
      type: 'script',
      stack: {
        callFrames: [
          {
            functionName: 'us',
            scriptId: '56',
            url: 'https://securepubads.g.doubleclick.net/gpt/foo.js',
            lineNumber: '0',
            columnNumber: '126445',
          },
        ],
      },
    },
  },
  {
    url: 'https://securepubads.g.doubleclick.net/gpt/foo.js',
    startTime: 1,
    endTime: 2,
    initiator: {
      type: 'parser',
    },
  },
];

export default networkRecords;
