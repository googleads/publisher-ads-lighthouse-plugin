const {Audit} = require('lighthouse');
const {boxViewableArea} = require('../utils/geometry');

/** @inheritDoc */
class ViewportAdDensity extends Audit {
  /**
   * @return {AuditMetadata}
   * @override
   */
  static get meta() {
    return {
      name: 'viewport-ad-density',
      description: 'Ad density inside the viewport',
      helpText: 'Computed as ad total area over viewport area',
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

    const adArea = slots.reduce((sum, slot) =>
      sum + boxViewableArea(slot, viewport), 0);
    // NOTE(gmatute): consider using content width instead of viewport
    const viewArea = viewport.innerWidth * viewport.innerHeight;

    if (viewArea <= 0) {
      throw new Error('viewport area is zero');
    }

    return {
      rawValue: Math.min(adArea / viewArea, 1),
      displayValue: `${Math.floor(100 * adArea / viewArea)}% viewport area`,
    };
  }
}

module.exports = ViewportAdDensity;
