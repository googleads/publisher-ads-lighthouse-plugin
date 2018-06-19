const {Gatherer} = require('lighthouse');

const AD_TAG_SELECTOR = 'script[src*="gpt.js"]';

/** @inheritdoc */
class StaticAdTags extends Gatherer {
  /**
   * @param {LH.Gatherer.PassContext} passContext
   */
  beforePass(passContext) {
    // Avoids DOM manipulation to extract tags from original HTML.
    passContext.disableJavaScript = true;
  }

  /**
   * @param {LH.Gatherer.PassContext} passContext
   * @return {Promise<Array<?LH.Crdp.DOM.BoxModel>>}
   */
  async afterPass(passContext) {
    const driver = passContext.driver;

    // Reset the JS disable.
    passContext.disableJavaScript = false;

    // TODO: Type this correctly. Perhaps using the 'devtools-protocol' NPM
    // module.
    // @ts-ignore
    const {root} = await driver.sendCommand('DOM.getDocument');
    const {nodeIds} = await driver.sendCommand('DOM.querySelectorAll', {
      nodeId: root.nodeId,
      selector: AD_TAG_SELECTOR,
    });

    // @ts-ignore
    return Promise.all(nodeIds.map(async (nodeId) =>
      (await driver.sendCommand('DOM.describeNode', {nodeId})).node));
  }
}

module.exports = StaticAdTags;
