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
function getClientRect(element) {
  return element.getBoundingClientRect();
}
/**
 * @return {Artifacts['IFrameElements']}
 */
function collectIFrameElements() {
  // @ts-ignore - put into scope via stringification
  const iFrameElements = getElementsInDocument('iframe'); // eslint-disable-line no-undef
  return iFrameElements.map(/** @param {HTMLIFrameElement} node */ (node) => {
    // @ts-ignore
    const clientRect = getClientRect(node).toJSON();
    // Marking 1x1 as non-visible to ignore tracking pixels.
    const isVisible = (clientRect.width > 1 && clientRect.height > 1);
    return {
      id: node.id,
      src: node.src,
      clientRect,
      isVisible,
    };
  });
}

/** @inheritdoc */
class IFrameElements extends Gatherer {
  /**
   * @param {LH.Gatherer.PassContext} passContext
   * @return {Promise<Artifacts['IFrameElements']>}
   * @override
   */
  async afterPass(passContext) {
    const driver = passContext.driver;

    const expression = `(() => {
      ${pageFunctions.getOuterHTMLSnippetString};
      ${pageFunctions.getElementsInDocumentString};
      ${getClientRect};
      return (${collectIFrameElements})();
    })()`;

    /** @type {Artifacts.IFrameElements} */
    return driver.evaluateAsync(expression, {useIsolation: true});
  }
}

module.exports = IFrameElements;
