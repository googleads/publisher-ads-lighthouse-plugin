const har = {
  log: {
    entries: [
      {
        request: {
          url: 'https://example.com/',
        },
        _initiator_detail: JSON.stringify({
          type: 'other',
        }),
      },
      {
        request: {
          url: 'https://test.com/',
        },
        _initiator_detail: JSON.stringify({
          type: 'parser',
        }),
      },
      {
        request: {
          url: 'https://quiz.com/',
        },
        _initiator_detail: JSON.stringify({
          type: 'parser',
        }),
      },
    ],
  },
};

module.exports = har;
