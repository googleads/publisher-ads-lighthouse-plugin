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

// @ts-ignore
const Gatherer = require('lighthouse/lighthouse-core/gather/gatherers/gatherer.js');
// @ts-ignore
const pageFunctions = require('lighthouse/lighthouse-core/lib/page-functions.js');

/* eslint-env browser, node */

/**
 * TODO(jburger): Move to page-functions.js once integrated with Lighthouse.
 * @param {HTMLIFrameElement} element
 * @return {DOMRect | ClientRect}
 */
function getBoxModel(element) {
  return element.getBoundingClientRect();
}
/**
 * @return {Array<LH.Crdp.DOM.BoxModel>}
 */
function collectIframeElements() {
  // @ts-ignore - put into scope via stringification
  const iframeElements = getElementsInDocument('iframe'); // eslint-disable-line no-undef
  return iframeElements.map(/** @param {HTMLIFrameElement} node */ (node) => {
    // @ts-ignore - put into scope via stringification
    const outerHTML = getOuterHTMLSnippet(node); // eslint-disable-line no-undef
    // @ts-ignore
    const boxModel = getBoxModel(node).toJSON();
    const isVisible = (boxModel.width > 0 && boxModel.height > 0);
    return {
      id: node.id,
      src: node.src,
      outerHTML,
      boxModel,
      isVisible,
    };
  });
}

/** @inheritdoc */
class IframeElements extends Gatherer {
  /**
   * @param {LH.Gatherer.PassContext} passContext
   * @return {Promise<Array<?LH.Crdp.DOM.BoxModel>>}
   * @override
   */
  async afterPass(passContext) {
    const driver = passContext.driver;

    const expression = `(() => {
      ${pageFunctions.getOuterHTMLSnippetString};
      ${pageFunctions.getElementsInDocumentString};
      ${getBoxModel};
      return (${collectIframeElements})();
    })()`;

    /** @type {Array<LH.Artifacts.AnchorElement>} */
    return driver.evaluateAsync(expression, {useIsolation: true});
  }
}

module.exports = IframeElements;
