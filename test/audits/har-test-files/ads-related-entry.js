const har = {
  log: {
    entries: [
      {
        request: {
          url: 'https://doubleclick.net/gampad/ads',
        },
        _initiator_detail: JSON.stringify({
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
        }),
      },
      {
        request: {
          url: 'https://securepubads.g.doubleclick.net/gpt/pubads_impl_216.js',
        },
        _initiator_detail: JSON.stringify({
          type: 'parser',
        }),
      },
    ],
  },
};

module.exports = har;
