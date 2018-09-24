const {auditNotApplicable} = require('../utils/builder');
const {Audit} = require('lighthouse');
const {hasAdRequestPath} = require('../utils/resource-classification');
const {URL} = require('url');

/** @inheritDoc */
class FullWidthSlots extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id: 'full-width-slots',
      title: 'Full Width Slots',
      description: 'Have ad slot sizes that utilize the viewport\'s full width' +
          ' to increase CTR.',
      requiredArtifacts: ['ViewportDimensions', 'devtoolsLogs'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts) {
    const devtoolsLogs = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const networkRecords = await artifacts.requestNetworkRecords(devtoolsLogs);
    const viewport = artifacts.ViewportDimensions;
    const vpWidth = viewport.innerWidth;

    /** @type {Array<URL>} */
    const adRequestUrls = networkRecords
        .map((record) => new URL(record.url))
        .filter(hasAdRequestPath);

    if (!adRequestUrls.length) {
      return auditNotApplicable('No ads requested.');
    }

    const sizeArrs = adRequestUrls.map((url) =>
      url.searchParams.get('prev_iu_szs') || url.searchParams.get('sz'));

    // Converts to array of widths, filtering out those larger than viewport
    // that are at least 1px wide.
    const sizes = sizeArrs.join('|').split(/[|,]/);

    const widths = sizes.map((size) => parseInt(size.split('x')[0]))
        .filter((w) => w <= vpWidth && w > 1);

    if (!widths.length) {
      return auditNotApplicable('No requested ads contain ads of valid width.');
    }

    const maxWidth = Math.max(...widths);

    const pctUnoccupied = 1 - (maxWidth / vpWidth);

    return {
      // TODO(jburger): Determine score cutoff based on results.
      score: pctUnoccupied > .2 ? 0 : 1,
      rawValue: pctUnoccupied,
      displayValue:
            Math.round(pctUnoccupied * 100) + '% of viewport width is unused.',
    };
  }
}

module.exports = FullWidthSlots;
