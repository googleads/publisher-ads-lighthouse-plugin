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
  {
    url: 'https://example.com/foo.js',
    startTime: 1,
    endTime: 2,
    initiator: {
      type: 'script',
      stack: {
        callFrames: [
          {
            functionName: 'us',
            scriptId: '56',
            url: 'https://example.com/bar.js',
            lineNumber: '0',
            columnNumber: '126445',
          },
        ],
      },
    },
  },
  {
    url: 'https://example.com/bar.js',
    startTime: 1,
    endTime: 2,
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
      type: 'parser',
    },
  },
  // have entry that does not have a callframe reference it
];

module.exports = networkRecords;
