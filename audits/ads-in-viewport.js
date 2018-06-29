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
      name: 'ads-in-viewport',
      description: 'Fails iff the page has too many (>3) ads outside the ' +
          'viewport at load time. For a better user experience and to ' +
          'improve viewability rates, below the fold ads should be loaded ' +
          'lazily as the user scrolls down.',
      helpText: 'Check how many ad slots are inside the viewport after loading',
      failureDescription: 'Too many ads loaded below the viewport which may' +
          'lower viewability and increase page load times.',
      scoreDisplayMode: 'binary',
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
      // Fail if there are 4 or more ads outside the viewport.
      score: (slots.length - viewed) >= 4 ? 1 : 0,
      displayValue: `${viewed} / ${slots.length} of ads were in the viewport`,
    };
  }
}

module.exports = AdsInViewport;
