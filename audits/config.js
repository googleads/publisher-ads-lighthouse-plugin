/**
 * Config for running lighthouse audits.
 * For the possible types, see
 * https://github.com/GoogleChrome/lighthouse/blob/master/typings/config.d.ts.
 * and
 * https://github.com/GoogleChrome/lighthouse/tree/master/lighthouse-core/config
 * @const {!LH.Config}
 */
module.exports = {
  extends: 'lighthouse:full',
  passes: [
    {
      passName: 'defaultPass',
      gatherers: [
        './gatherers/network',
      ],
    },
    {
      passName: 'javascriptDisabled',
      gatherers: [
        './gatherers/static-ad-tags',
      ],
    },
  ],

  audits: [
    './audits/has-ads',
    './audits/async-ad-tags',
    './audits/loads-gpt-over-https',
  ],
};
