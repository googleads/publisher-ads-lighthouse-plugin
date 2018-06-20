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
              {
                functionName: 'us',
                scriptId: '56',
                url: 'https://example.com/gpt/bar.js',
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
          type: 'script',
          stack: {
            callFrames: [
              {
                functionName: 'us',
                scriptId: '56',
                url: 'https://doubleclick.net/gampad/ads/gpt.js',
                lineNumber: '0',
                columnNumber: '126445',
              },
            ],
          },
        }),
      },
      {
        request: {
          url: 'https://example.com/gpt/bar.js',
        },
        _initiator_detail: JSON.stringify({
          type: 'parser',
        }),
      },
      {
        request: {
          url: 'https://doubleclick.net/gampad/ads/gpt.js',
        },
        _initiator_detail: JSON.stringify({
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
        }),
      },
      {
        request: {
          url: 'https://securepubads.g.doubleclick.net/gpt/foo.js',
        },
        _initiator_detail: JSON.stringify({
          type: 'parser',
        }),
      },
    ],
  },
};

module.exports = har;
