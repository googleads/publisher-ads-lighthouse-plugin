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
            url: 'https://www.googletagservices.com/tag/js/gpt.js',
            lineNumber: '0',
            columnNumber: '126445',
          },
        ],
      },
    },
  },
  // Filtered out GPT loader script.
  {
    url: 'https://www.googletagservices.com/tag/js/gpt.js',
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
          {
            functionName: 'us',
            scriptId: '56',
            url: 'https://securepubads.g.doubleclick.net/gpt/bar.js',
            lineNumber: '0',
            columnNumber: '126445',
          },
        ],
      },
    },
  },
  {
    url: 'https://securepubads.g.doubleclick.net/gpt/bar.js',
    startTime: 1,
    endTime: 2,
    initiator: {
      type: 'script',
      stack: {
        callFrames: [
          {
            functionName: 'us',
            scriptId: '56',
            url: 'https://securepubads.g.doubleclick.net/gpt/bat.js',
            lineNumber: '0',
            columnNumber: '126445',
          },
        ],
      },
    },
  },
  {
    url: 'https://securepubads.g.doubleclick.net/gpt/bat.js',
    startTime: 1,
    endTime: 2,
    initiator: {
      type: 'script',
      stack: {
        callFrames: [
          {
            functionName: 'us',
            scriptId: '56',
            url: 'https://securepubads.g.doubleclick.net/gpt/baz.js',
            lineNumber: '0',
            columnNumber: '126445',
          },
        ],
      },
    },
  },
  {
    url: 'https://securepubads.g.doubleclick.net/gpt/baz.js',
    startTime: 1,
    endTime: 2,
    initiator: {
      type: 'script',
      stack: {
        callFrames: [
          {
            functionName: 'us',
            scriptId: '56',
            url: 'https://securepubads.g.doubleclick.net/gpt/bat.js',
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

module.exports = networkRecords;
