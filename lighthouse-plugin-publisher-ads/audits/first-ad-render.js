// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const ComputedAdRenderTime = require('../computed/ad-render-time');
const i18n = require('lighthouse/lighthouse-core/lib/i18n/i18n');
const {auditNotApplicable, runWarning} = require('../messages/common-strings');
const {Audit} = require('lighthouse');

const UIStrings = {
  title: 'Latency of first ad render',
  failureTitle: 'Reduce time to render first ad',
  description: 'This metric measures the time for the first ad iframe to ' +
  'render from page navigation. [Learn more](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/first-ad-render' +
  ').',
  displayValue: '{timeInMs, number, seconds} s',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

/**
 * Measures the first ad render time.
 */
class FirstAdRender extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    // @ts-ignore
    return {
      id: 'first-ad-render',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      // @ts-ignore
      scoreDisplayMode: Audit.SCORING_MODES.NUMERIC,
      // @ts-ignore
      requiredArtifacts: ['devtoolsLogs', 'traces'],
    };
  }

  /**
   * @return {{
   *   simulate: {
   *    default: LH.Audit.ScoreOptions, lightrider: LH.Audit.ScoreOptions
   *   },
   *   provided: LH.Audit.ScoreOptions
   * }}
   */
  static get defaultOptions() {
    return {
      simulate: {
        default: {
          scorePODR: 8500,
          scoreMedian: 15000,
          // Derived from the existing PODR and median points.
          p10: 9400,
        },
        // 75th & 95th percentile with simulation.
        // Specific to LR due to patch of
        // https://github.com/GoogleChrome/lighthouse/pull/9910. Will update
        // values after next LH release.
        lightrider: {
          scorePODR: 11000,
          scoreMedian: 22000,
          // Derived from the existing PODR and median points.
          p10: 12900,
        },
      },
      provided: {
        scorePODR: 2700,
        scoreMedian: 3700,
        // Derived from the existing PODR and median points.
        p10: 2750,
      },

    };
  }
  /**
   * @param {Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts, context) {
    const trace = artifacts.traces[Audit.DEFAULT_PASS];
    const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const metricData = {
      devtoolsLog,
      trace,
      settings: context.settings,
    };
    const {timing} = await ComputedAdRenderTime.request(metricData, context);

    if (!(timing > 0)) { // Handle NaN, etc.
      context.LighthouseRunWarnings.push(runWarning.NoAdRendered);
      return auditNotApplicable.NoAdRendered;
    }

    let scoreOptions = context.options[
        context.settings.throttlingMethod == 'provided' ?
          'provided' :
          'simulate'
    ];
    if (scoreOptions.lightrider) {
      scoreOptions =
        scoreOptions[global.isLightrider ? 'lightrider' : 'default'];
    }

    return {
      numericValue: timing * 1e-3,
      score: Audit.computeLogNormalScore(
        {p10: scoreOptions.p10, median: scoreOptions.scoreMedian},
        timing
      ),
      displayValue:
        str_(UIStrings.displayValue, {timeInMs: timing}),
    };
  }
}
module.exports = FirstAdRender;
module.exports.UIStrings = UIStrings;
