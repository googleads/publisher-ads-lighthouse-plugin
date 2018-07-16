const AdBlockingTasks = require('../../audits/ad-blocking-tasks');
const {expect} = require('chai');

const generateTask = ([start, end], groupLabel, eventName) => ({
  event: {eventName, ts: start*1000},
  group: {label: groupLabel},
  duration: end - start,
  startTime: start,
  endTime: end,
  children: [],
});

const generateReq = ([start, response, end], id, url) => ({
  _responseReceivedTime: response / 1000,
  startTime: start / 1000,
  endTime: end / 1000,
  requestId: id,
  url,
});

const makeArtifacts = (requests, tasks, offset = 0) => {
  const traceEvents = requests.map(({startTime, requestId}) => ({
    ts: (startTime * 1000 + offset) * 1000,
    name: 'ResourceSendRequest',
    args: {data: {requestId}},
  }));

  return {
    Network: {networkRecords: requests},
    requestMainThreadTasks: async () => tasks,
    traces: {defaultPass: {traceEvents}},
  };
};

describe('AdBlockingTasks', () => {
  describe('rawValue', () => {
    it('should succeed if there are no ad requests', async () => {
      const tasks = [
        generateTask([0, 40], 'Parse HTML'),
        generateTask([140, 160], 'Script Evaluation'),
        generateTask([200, 350], 'Script Evaluation'),
        generateTask([500, 520], 'Script Evaluation'),
      ];

      const requests = [
        generateReq([110, 150, 160], 1, 'https://example.com'),
        generateReq([210, 300, 360], 2, 'https://test.com'),
      ];

      const artifacts = makeArtifacts(requests, tasks);
      const result = await AdBlockingTasks.audit(artifacts);
      expect(result).to.have.property('rawValue', true);
    });

    it('should succeed if there are no long tasks', async () => {
      const tasks = [
        generateTask([0, 40], 'Parse HTML'),
        generateTask([140, 160], 'Script Evaluation'),
        generateTask([300, 310], 'Script Evaluation'),
        generateTask([500, 520], 'Script Evaluation'),
      ];

      const requests = [
        generateReq([110, 150, 160], 1, 'https://googletagservices.com'),
        generateReq([210, 300, 310], 2, 'https://doubleclick.net'),
        generateReq([410, 500, 510], 3, 'https://googlesyndication.com'),
      ];

      const artifacts = makeArtifacts(requests, tasks);
      const result = await AdBlockingTasks.audit(artifacts);
      expect(result).to.have.property('rawValue', true);
    });

    it('should succeed if there is no long tasks overlap', async () => {
      const tasks = [
        generateTask([0, 100], 'Parse HTML'),
        generateTask([200, 300], 'Script Evaluation'),
        generateTask([450, 600], 'Script Evaluation'),
        generateTask([750, 900], 'Script Evaluation'),
      ];

      const requests = [
        generateReq([110, 150, 160], 1, 'https://googletagservices.com'),
        generateReq([310, 400, 410], 2, 'https://doubleclick.net'),
        generateReq([610, 700, 710], 3, 'https://googlesyndication.com'),
      ];

      const artifacts = makeArtifacts(requests, tasks);
      const result = await AdBlockingTasks.audit(artifacts);
      expect(result).to.have.property('rawValue', true);
    });

    it('should fail if any long task blocks and ad request', async () => {
      const tasks = [
        generateTask([0, 40], 'Parse HTML'),
        generateTask([140, 160], 'Script Evaluation'),
        generateTask([300, 360], 'Script Evaluation'), // Long Task
        generateTask([500, 520], 'Script Evaluation'),
      ];

      const requests = [
        generateReq([110, 150, 160], 1, 'https://googletagservices.com'),
        generateReq([210, 300, 360], 2, 'https://doubleclick.net'), // Block
        generateReq([410, 500, 510], 3, 'https://googlesyndication.com'),
      ];

      const artifacts = makeArtifacts(requests, tasks);
      const result = await AdBlockingTasks.audit(artifacts);
      expect(result).to.have.property('rawValue', false);
    });

    it('should handle offsets in the network timeline', async () => {
      const tasks = [
        generateTask([0, 40], 'Parse HTML'),
        generateTask([140, 160], 'Script Evaluation'),
        generateTask([300, 360], 'Script Evaluation'), // Long Task
        generateTask([500, 520], 'Script Evaluation'),
      ];

      const offset = -1000;

      const requests = [
        generateReq([1110, 1150, 1160], 1, 'https://googletagservices.com'),
        generateReq([1210, 1300, 1360], 2, 'https://doubleclick.net'), // Block
        generateReq([1410, 1500, 1510], 3, 'https://googlesyndication.com'),
      ];

      const artifacts = makeArtifacts(requests, tasks, offset);
      const result = await AdBlockingTasks.audit(artifacts);
      expect(result).to.have.property('rawValue', false);
    });

    it('should handle network requests out of order', async () => {
      const tasks = [
        generateTask([0, 40], 'Parse HTML'),
        generateTask([140, 160], 'Script Evaluation'),
        generateTask([300, 360], 'Script Evaluation'), // Long Task
        generateTask([500, 520], 'Script Evaluation'),
      ];

      const offset = -1000;

      const requests = [
        generateReq([1410, 1500, 1510], 3, 'https://googlesyndication.com'),
        generateReq([1110, 1150, 1160], 1, 'https://googletagservices.com'),
        generateReq([1210, 1300, 1360], 2, 'https://doubleclick.net'), // Block
      ];

      const artifacts = makeArtifacts(requests, tasks, offset);
      const result = await AdBlockingTasks.audit(artifacts);
      expect(result).to.have.property('rawValue', false);
    });
  });
});
