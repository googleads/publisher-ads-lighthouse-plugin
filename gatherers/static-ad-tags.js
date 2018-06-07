const {Gatherer} = require('lighthouse');

const AD_TAG_SELECTOR = 'script[src*="gpt.js"]';

/** @inheritdoc */
class StaticAdTags extends Gatherer {
  /** @override */
  beforePass(passContext) {
    // Avoids DOM manipulation to extract tags from original HTML.
    passContext.disableJavaScript = true;
  }

  /** @override */
  async afterPass(passContext) {
    const driver = passContext.driver;

    // Reset the JS disable.
    passContext.disableJavaScript = false;

    const {root} = await driver.sendCommand('DOM.getDocument');
    const {nodeIds} = await driver.sendCommand('DOM.querySelectorAll', {
      nodeId: root.nodeId,
      selector: AD_TAG_SELECTOR,
    });

    return Promise.all(nodeIds.map(async (nodeId) =>
      (await driver.sendCommand('DOM.describeNode', {nodeId})).node));
  }
}

module.exports = StaticAdTags;
