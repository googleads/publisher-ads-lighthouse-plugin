const har = {
  log: {
    entries: [
      {
        request: {
          url: 'https://example.com/script/index.js',
        },
        _initiator_detail: JSON.stringify({
          type: 'parser',
        }),
      },
      {
        request: {
          url: 'https://test.com/script/test.js',
        },
        _initiator_detail: JSON.stringify({
          type: 'parser',
        }),
      },
      {
        request: {
          url: 'https://quiz.com/script/example.js',
        },
        _initiator_detail: JSON.stringify({
          type: 'parser',
        }),
      },
    ],
  },
};

module.exports = har;
