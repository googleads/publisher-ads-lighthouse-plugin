const networkRecords = [
  {
    url: 'https://doubleclick.net/gampad/ads',
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
    url: 'https://securepubads.g.doubleclick.net/gpt/pubads_impl_216.js',
    initiator: {
      type: 'parser',
    },
  },
  // have entry that does not have a callframe reference it
];

module.exports = networkRecords;
