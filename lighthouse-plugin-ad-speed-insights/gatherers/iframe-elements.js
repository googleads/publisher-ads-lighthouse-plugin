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
 * @param {HTMLElement} element
 * @param {String} attr
 * @return {String}
 */
function getStyleAttrValue(element, attr) {
  // Check style before computedStyle as computedStyle is expensive.
  // @ts-ignore
  return element.style[attr] || window.getComputedStyle(element)[attr];
}

/**
 * TODO(jburger): Move to page-functions.js once integrated with Lighthouse.
 * @param {HTMLElement} element
 * @return {Boolean}
 */
function hasScrollableAncestor(element) {
  let currentEl = element.parentElement;
  while (currentEl) {
    if (currentEl.scrollHeight > currentEl.clientHeight) {
      const yScroll = getStyleAttrValue(currentEl, 'overflowY');
      if (yScroll) {
        return true;
      }
    }
    currentEl = currentEl.parentElement;
  }
  return false;
}

/**
 * TODO(jburger): Move to page-functions.js once integrated with Lighthouse.
 * @param {?HTMLElement} element
 * @return {Boolean}
 */
function isFixed(element) {
  let currentEl = element;
  while (currentEl) {
    const position = getStyleAttrValue(currentEl, 'position');
    // Only truly fixed if an ancestor is scrollable.
    if (position == 'fixed' && hasScrollableAncestor(currentEl)) {
      return true;
    }
    currentEl = currentEl.parentElement;
  }
  return false;
}

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
      isFixed: isVisible && isFixed(node),
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

    const {frameTree} = await driver.sendCommand('Page.getFrameTree');
    const framesByDomId = new Map();
    for (const {frame} of frameTree.childFrames) {
      if (framesByDomId.has(frame.name)) {
        // DOM ID collision, mark it as null.
        framesByDomId.set(frame.name, null);
      } else {
        framesByDomId.set(frame.name, frame);
      }
    }

    const expression = `(() => {
      ${pageFunctions.getOuterHTMLSnippetString};
      ${pageFunctions.getElementsInDocumentString};
      ${getClientRect};
      ${getStyleAttrValue};
      ${hasScrollableAncestor};
      ${isFixed};
      return (${collectIFrameElements})();
    })()`;

    /** @type {Artifacts['IFrameElements']} */
    const elements =
        await driver.evaluateAsync(expression, {useIsolation: true});
    for (const el of elements) {
      el.frame = framesByDomId.get(el.id);
    }
    return elements;
  }
}

module.exports = IFrameElements;
