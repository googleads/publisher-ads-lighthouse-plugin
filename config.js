/**
 * Config for running lighthouse audits.
 * For the possible types, see
 * https://github.com/GoogleChrome/lighthouse/blob/master/typings/config.d.ts.
 * and
 * https://github.com/GoogleChrome/lighthouse/tree/master/lighthouse-core/config
 * @const {LH.Config}
 */
module.exports = {
  extends: 'lighthouse:full',
  passes: [
    {
      passName: 'defaultPass',
      gatherers: [
        './gatherers/network',
        './gatherers/rendered-ad-slots',
      ],
    },
    {
      passName: 'redirectPass',
      gatherers: [
        './gatherers/static-ad-tags',
      ],
    },
  ],

  audits: [
    './audits/ads-in-viewport',
    './audits/async-ad-tags',
    './audits/has-ads',
    './audits/loads-gpt-over-https',
    './audits/viewport-ad-density',
    './audits/ad-request-critical-path',
  ],

  groups: {
    'ads-best-practices': {
      title: 'Best Practices',
    },
    'ads-header-bidding': {
      title: 'Header Bidding',
    },
  },

  categories: {
    'ads-quality': {
      title: 'Ad Quality',
      auditRefs: [
        {id: 'async-ad-tags', weight: 1, group: 'ads-best-practices'},
        {id: 'loads-gpt-over-https', weight: 1, group: 'ads-best-practices'},
        {id: 'serial-header-bidding', weight: 1, group: 'ads-header-bidding'},
      ],
    },
  },
};
