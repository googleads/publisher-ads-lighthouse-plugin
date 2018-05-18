/**
 * Config for running lighthouse audits.
 * For the possible types, see
 * https://github.com/GoogleChrome/lighthouse/blob/master/typings/config.d.ts.
 * and
 * https://github.com/GoogleChrome/lighthouse/tree/master/lighthouse-core/config
 * @const {!LH.Config}
 */
module.exports = {
  extends: 'lighthouse:default',
  passes: [
    {
      passName: 'defaultPass',
      pauseAfterLoadMs: 10000,
      pauseAfterNetworkQuietMs: 10000,
      recordTrace: true,
      gatherers: [
        './gatherers/ads',
        'js-usage',
      ],
    },
  ],

  audits: [
    './audits/has-ads',
    'byte-efficiency/unused-javascript',
    'first-meaningful-paint',
    'mixed-content',
  ],
};
