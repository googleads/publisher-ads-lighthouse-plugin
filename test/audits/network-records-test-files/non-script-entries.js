const networkRecords = [
  {
    url: 'https://example.com',
    statusCode: 200,
    startTime: 0,
  },
  {
    url: 'https://example.com/',
    startTime: 1,
    endTime: 2,
    initiator: {
      type: 'other',
    },
  },
  {
    url: 'https://test.com/',
    startTime: 1,
    endTime: 2,
    initiator: {
      type: 'parser',
    },
  },
  {
    url: 'https://quiz.com/',
    startTime: 1,
    endTime: 2,
    initiator: {
      type: 'parser',
    },
  },
];

module.exports = networkRecords;
