const StaticAdTags = require('../../gatherers/static-ad-tags');
const sinon = require('sinon');
const {expect} = require('chai');

describe('StaticAdTags', () => {
  let staticAdTags;
  let sendCommand;

  beforeEach(() => {
    staticAdTags = new StaticAdTags();
    sendCommand = sinon.stub();

    sendCommand.withArgs('DOM.getDocument')
      .resolves({root: {nodeId: 1}});
    sendCommand.withArgs('DOM.describeNode', sinon.match.any)
      .resolves({node: {}});
  });

  describe('disableJavaScript', () => {
    it('should disable JS before pass', () => {
      const passContext = {
        disableJavaScript: false,
      };

      staticAdTags.beforePass(passContext);
      expect(passContext).property('disableJavaScript', true);
    });

    it('should reenable JS after pass', async () => {
      const passContext = {
        disableJavaScript: true,
        driver: {
          sendCommand: sinon.fake.resolves({
            nodeIds: [],
            root: {},
          }),
        },
      };

      await staticAdTags.afterPass(passContext);
      expect(passContext).property('disableJavaScript', false);
    });
  });

  describe('gathererData', () => {
    it('should use the driver API correctly', async () => {
      sendCommand.withArgs('DOM.querySelectorAll', sinon.match.any)
        .resolves({nodeIds: [3]});

      await staticAdTags.afterPass({driver: {sendCommand}});
      const calls = sendCommand.getCalls();

      expect(calls).to.have.lengthOf(3);
      expect(calls[0].args).to.eql(['DOM.getDocument']);
      expect(calls[1].args).to.eql(['DOM.querySelectorAll', {
        nodeId: 1, selector: 'script[src*="gpt.js"]'}]);
      expect(calls[2].args).to.eql(['DOM.describeNode', {nodeId: 3}]);
    });

    it('should return empty array if no ad tags', async () => {
      sendCommand.withArgs('DOM.querySelectorAll', sinon.match.any)
        .resolves({nodeIds: []});

      const passContext = {driver: {sendCommand}};
      const data = await staticAdTags.afterPass(passContext);
      expect(data).to.be.empty;
    });

    it('should return array with one tag', async () => {
      sendCommand.withArgs('DOM.querySelectorAll', sinon.match.any)
        .resolves({nodeIds: [1]});

      const passContext = {driver: {sendCommand}};
      const data = await staticAdTags.afterPass(passContext);
      expect(data).to.have.lengthOf(1);
    });

    it('should return array with many tags', async () => {
      sendCommand.withArgs('DOM.querySelectorAll', sinon.match.any)
        .resolves({nodeIds: [1, 4, 7]});

      const passContext = {driver: {sendCommand}};
      const data = await staticAdTags.afterPass(passContext);
      expect(data).to.have.lengthOf(3);
    });
  });
});
