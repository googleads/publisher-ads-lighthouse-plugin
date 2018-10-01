const networkRecords = [
  {
    url: 'https://example.com',
    statusCode: 200,
    startTime: 0,
  },
  {
    url: 'https://example.com/script/index.js',
    startTime: 1,
    endTime: 2,
    initiator: {
      type: 'parser',
    },
  },
  {
    url: 'https://test.com/script/test.js',
    startTime: 1,
    endTime: 2,
    initiator: {
      type: 'parser',
    },
  },
  {
    url: 'https://quiz.com/script/example.js',
    startTime: 1,
    endTime: 2,
    initiator: {
      type: 'parser',
    },
  },
];

module.exports = networkRecords;
