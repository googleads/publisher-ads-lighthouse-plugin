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
        require.resolve('./gatherers/rendered-ad-slots'),
      ],
    },
  ],

  audits: [
    require.resolve('./audits/ad-blocking-tasks'),
    require.resolve('./audits/ad-request-critical-path'),
    require.resolve('./audits/ads-in-viewport'),
    require.resolve('./audits/async-ad-tags'),
    require.resolve('./audits/has-ads'),
    require.resolve('./audits/loads-gpt-over-https'),
    require.resolve('./audits/static-ad-tags'),
    require.resolve('./audits/viewport-ad-density'),
    require.resolve('./audits/tag-load-time'),
    require.resolve('./audits/ad-request-from-page-start'),
    require.resolve('./audits/ad-request-from-tag-load'),
    require.resolve('./audits/full-width-slots'),
    require.resolve('./audits/ad-top-of-viewport'),
  ],

  groups: {
    'ads-best-practices': {
      title: 'Best Practices',
    },
    'ads-performance': {
      title: 'Performance',
    },
    'measurements': {
      title: 'Measurements',
    },
  },

  categories: {
    'ads-quality': {
      title: 'Ad Quality',
      auditRefs: [
        {id: 'ad-blocking-tasks', weight: 1, group: 'ads-performance'},
        {id: 'ad-request-critical-path', weight: 1, group: 'ads-performance'},
        {id: 'ads-in-viewport', weight: 1, group: 'ads-best-practices'},
        {id: 'async-ad-tags', weight: 1, group: 'ads-best-practices'},
        {id: 'loads-gpt-over-https', weight: 1, group: 'ads-best-practices'},
        {id: 'static-ad-tags', weight: 1, group: 'ads-best-practices'},
        {id: 'viewport-ad-density', weight: 1, group: 'ads-best-practices'},
        {id: 'tag-load-time', weight: 1, group: 'measurements'},
        {id: 'ad-request-from-page-start', weight: 1, group: 'measurements'},
        {id: 'ad-request-from-tag-load', weight: 1, group: 'measurements'},
        {id: 'full-width-slots', weight: 1, group: 'ads-best-practices'},
        {id: 'ad-top-of-viewport', weight: 1, group: 'measurements'},
      ],
    },
  },

  settings: {
    onlyCategories: [
      'ads-quality',
    ],
  },
};
