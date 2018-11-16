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

const {Gatherer} = require('lighthouse');

const AD_SLOT_SELECTOR = 'iframe[id^=google_ads_iframe_]';

/** @inheritdoc */
class RenderedAdSlots extends Gatherer {
  /**
   * @param {LH.Gatherer.PassContext} passContext
   * @return {Promise<Array<?LH.Crdp.DOM.BoxModel>>}
   * @override
   */
  async afterPass(passContext) {
    const driver = passContext.driver;

    // This ensures that any page or container scrolls caused by user or prior
    // gatherer are reset.
    await driver.evaluateAsync(
      'document.querySelectorAll(\'*\').forEach(el => el.scrollTop = 0)');

    // TODO: Type this correctly. Perhaps using the 'devtools-protocol' NPM
    // module.
    // @ts-ignore
    const {root} = await driver.sendCommand('DOM.getDocument');
    const {nodeIds} = await driver.sendCommand('DOM.querySelectorAll', {
      // @ts-ignore
      nodeId: root.nodeId,
      selector: AD_SLOT_SELECTOR,
    });

    // @ts-ignore
    return Promise.all(nodeIds.map(async (nodeId) => {
      try {
        const [{attributes}, {model}] = await Promise.all([
          driver.sendCommand('DOM.getAttributes', {nodeId}),
          driver.sendCommand('DOM.getBoxModel', {nodeId}),
        ]);
        const idIndex = attributes.indexOf('id') + 1;
        const id = attributes[idIndex].split('/').slice(3).join('/');
        model.id = id;
        return model;
      } catch (e) {
        // getBoxModel fails if the element is hidden (e.g. display:none)
        return null;
      }
    }));
  }
}

module.exports = RenderedAdSlots;
