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
    url: 'https://securepubads.g.doubleclick.net/gpt/pubads_impl_216.js',
    initiator: {
      type: 'parser',
    },
  },
];

module.exports = networkRecords;
