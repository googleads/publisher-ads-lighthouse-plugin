const array = require('../utils/array');
const {Audit} = require('lighthouse');
const {isBoxInViewport} = require('../utils/geometry');

/** @inheritDoc */
class AdsInViewport extends Audit {
  /**
   * @return {AuditMetadata}
   * @override
   */
  static get meta() {
    return {
      id: 'ads-in-viewport',
      title: 'Eager ads loaded within viewport',
      description: 'Too many ads loaded outside the viewport lowers ' +
          'viewability rates and impact user experience, consider loading ' +
          'ads below the fold lazily as the user scrolls down.',
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
    const slots = artifacts.RenderedAdSlots;

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
