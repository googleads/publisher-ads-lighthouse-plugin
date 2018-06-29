const array = require('../utils/array');
const {Audit} = require('lighthouse');
const {isBoxInViewport} = require('../utils/geometry');

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

  /**
   * @override
   * @param {Artifacts} artifacts
   * @return {LH.Audit.Product}
   */
  static audit(artifacts) {
    const viewport = artifacts.ViewportDimensions;
    const slots = artifacts.RenderedAdSlots || [];

    // TODO(gmatute): account for scrolling, deep links, and reflows
    const viewed = array.count(slots, (slot) =>
      isBoxInViewport(slot, viewport));

    return {
      rawValue: !slots.length || viewed / slots.length,
      displayValue: `${viewed} / ${slots.length} of ads were in the viewport`,
    };
  }
}

module.exports = AdsInViewport;
