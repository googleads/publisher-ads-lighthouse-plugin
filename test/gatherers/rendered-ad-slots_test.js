// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const RenderedAdSlots = require('../../gatherers/rendered-ad-slots');
const sinon = require('sinon');
const {expect} = require('chai');

describe('RenderedAdSlots', () => {
  let renderedAdSlots;
  let sendCommand;
  let evaluateAsync;

  beforeEach(() => {
    renderedAdSlots = new RenderedAdSlots();
    sendCommand = sinon.stub();
    evaluateAsync = sinon.stub();

    sendCommand.withArgs('DOM.getDocument')
        .resolves({root: {nodeId: 1}});
    sendCommand.withArgs('DOM.getBoxModel', sinon.match.any)
        .resolves({model: {}});
  });

  describe('gathererData', () => {
    it('should use the driver API correctly', async () => {
      sendCommand.withArgs('DOM.querySelectorAll', sinon.match.any)
          .resolves({nodeIds: [3]});

      await renderedAdSlots.afterPass({driver: {sendCommand, evaluateAsync}});
      const calls = sendCommand.getCalls();

      expect(calls).to.have.lengthOf(3);
      expect(calls[0].args).to.eql(['DOM.getDocument']);
      expect(calls[1].args).to.eql(['DOM.querySelectorAll', {
        nodeId: 1, selector: 'iframe[id^=google_ads_iframe_]'}]);
      expect(calls[2].args).to.eql(['DOM.getBoxModel', {nodeId: 3}]);
    });

    it('should return empty array if no ad slots', async () => {
      sendCommand.withArgs('DOM.querySelectorAll', sinon.match.any)
          .resolves({nodeIds: []});

      const passContext = {driver: {sendCommand, evaluateAsync}};
      const data = await renderedAdSlots.afterPass(passContext);
      expect(data).to.be.empty;
    });

    it('should return array with one tag', async () => {
      sendCommand.withArgs('DOM.querySelectorAll', sinon.match.any)
          .resolves({nodeIds: [1]});

      const passContext = {driver: {sendCommand, evaluateAsync}};
      const data = await renderedAdSlots.afterPass(passContext);
      expect(data).to.have.lengthOf(1);
    });

    it('should return array with many slots', async () => {
      sendCommand.withArgs('DOM.querySelectorAll', sinon.match.any)
          .resolves({nodeIds: [1, 4, 7]});

      const passContext = {driver: {sendCommand, evaluateAsync}};
      const data = await renderedAdSlots.afterPass(passContext);
      expect(data).to.have.lengthOf(3);
    });
  });
});
