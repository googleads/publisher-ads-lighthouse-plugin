const array = require('../utils/array.js');
const assert = require('assert');
const {Audit} = require('lighthouse');

/**
 * @param {!LH.Artifacts.ViewportDimensions} viewport
 * @param {?LH.Crdp.DOM.BoxModel} slot
 * @return {boolean}
 */
function isSlotViewable(viewport, slot) {
  if (!slot) return false;

  const {innerWidth, innerHeight} = viewport;
  const [left, top, right, _t, _r, bottom, _l, _b] = slot.content;
  assert(left == _l && top == _t && right == _r && bottom == _b);

  return left < right && top < bottom && // Non-zero area
    left < innerWidth && top < innerHeight && 0 < right && 0 < bottom;
}

/** @inheritDoc */
class AdsInViewport extends Audit {
  /** @override */
  static get meta() {
    return {
      name: 'ads-in-viewport',
      description: 'Check how many ad slots are visible',
      helpText: 'Check how many ad slots are inside the viewport after loading',
      requiredArtifacts: ['ViewportDimensions', 'RenderedAdSlots'],
    };
  }

  /** @override */
  static audit(artifacts) {
    const viewport = artifacts.ViewportDimensions;
    const slots = artifacts.RenderedAdSlots;

    // TODO(gmatute): account for scrolling, deep links, ads moved by content
    const viewed = array.count(slots, (slot) => isSlotViewable(viewport, slot));

    return {
      rawValue: !slots.length || viewed / slots.length,
      displayValue: `${viewed} / ${slots.length} of ads were in the viewport`,
    };
  }
}

module.exports = AdsInViewport;
