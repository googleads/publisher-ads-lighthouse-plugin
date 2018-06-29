const {Gatherer} = require('lighthouse');

const AD_SLOT_SELECTOR = 'iframe[id^=google_ads_iframe_]';

/** @inheritdoc */
class RenderedAdSlots extends Gatherer {
  /**
   * @param {LH.Gatherer.PassContext} passContext
   * @return {Promise<Array<?LH.Crdp.DOM.BoxModel>>}
   */
  async afterPass(passContext) {
    const driver = passContext.driver;

    const {root} = await driver.sendCommand('DOM.getDocument');
    const {nodeIds} = await driver.sendCommand('DOM.querySelectorAll', {
      nodeId: root.nodeId,
      selector: AD_SLOT_SELECTOR,
    });

    return Promise.all(nodeIds.map(async (nodeId) => {
      try {
        return (await driver.sendCommand('DOM.getBoxModel', {nodeId})).model;
      } catch (e) {
        // getBoxelModel fails if the element is hidden (e.g. display:none)
        return null;
      }
    }));
  }
}

module.exports = RenderedAdSlots;
