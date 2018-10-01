const networkRecords = [
  {
    url: 'https://example.com',
    statusCode: 200,
    startTime: 0,
  },
  {
    url: 'https://doubleclick.net/gampad/ads',
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
  {
    url: 'https://securepubads.g.doubleclick.net/gpt/pubads_impl_216.js',
    startTime: 1,
    endTime: 2,
    initiator: {
      type: 'parser',
    },
  },
];

module.exports = networkRecords;
