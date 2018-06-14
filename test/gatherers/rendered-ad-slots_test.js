const RenderedAdSlots = require('../../gatherers/rendered-ad-slots');
const sinon = require('sinon');
const {expect} = require('chai');

describe('RenderedAdSlots', () => {
  let renderedAdSlots;
  let sendCommand;

  beforeEach(() => {
    renderedAdSlots = new RenderedAdSlots();
    sendCommand = sinon.stub();

    sendCommand.withArgs('DOM.getDocument')
      .resolves({root: {nodeId: 1}});
    sendCommand.withArgs('DOM.getBoxModel', sinon.match.any)
      .resolves({model: {}});
  });

  describe('gathererData', () => {
    it('should return empty array if no ad slots', async () => {
      sendCommand.withArgs('DOM.querySelectorAll', sinon.match.any)
        .resolves({nodeIds: []});

      const passContext = {driver: {sendCommand}};
      const data = await renderedAdSlots.afterPass(passContext);
      expect(data).to.be.empty;
    });

    it('should return array with one tag', async () => {
      sendCommand.withArgs('DOM.querySelectorAll', sinon.match.any)
        .resolves({nodeIds: [1]});

      const passContext = {driver: {sendCommand}};
      const data = await renderedAdSlots.afterPass(passContext);
      expect(data).to.have.lengthOf(1);
    });

    it('should return array with many slots', async () => {
      sendCommand.withArgs('DOM.querySelectorAll', sinon.match.any)
        .resolves({nodeIds: [1, 4, 7]});

      const passContext = {driver: {sendCommand}};
      const data = await renderedAdSlots.afterPass(passContext);
      expect(data).to.have.lengthOf(3);
    });
  });
});
