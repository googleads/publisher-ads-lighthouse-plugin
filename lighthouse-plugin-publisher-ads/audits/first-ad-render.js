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

import ComputedAdRenderTime from '../computed/ad-render-time.js';

import * as i18n from 'lighthouse/core/lib/i18n/i18n.js';
import {auditNotApplicable, runWarning} from '../messages/common-strings.js';
import {Audit} from 'lighthouse';

const UIStrings = {
  title: 'Latency of first ad render',
  failureTitle: 'Reduce time to render first ad',
  description: 'This metric measures the time for the first ad iframe to ' +
  'render from page navigation. [Learn more](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/first-ad-render' +
  ').',
  displayValue: '{timeInMs, number, seconds} s',
};

const str_ = i18n.createIcuMessageFn(import.meta.url, UIStrings);

/**
 * Measures the first ad render time.
 */
class FirstAdRender extends Audit {
  /**
   * @return {LH.Audit.Meta}
   */
  static get meta() {
    return {
      id: 'first-ad-render',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      scoreDisplayMode: Audit.SCORING_MODES.NUMERIC,
      requiredArtifacts: ['devtoolsLogs', 'traces', 'URL', 'GatherContext'],
    };
  }

  /**
   * @return {{
   *   simulate: LH.Audit.ScoreOptions,
   *   provided: LH.Audit.ScoreOptions
   * }}
   */
  static get defaultOptions() {
    return {
      simulate: {
        p10: 12900,
        median: 22000,
      },
      provided: {
        p10: 2750,
        median: 3700,
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
      trace,
      devtoolsLog,
      settings: context.settings,
      URL: artifacts.URL,
      gatherContext: artifacts.GatherContext,
    };
    const {timing} = await ComputedAdRenderTime.request(metricData, context);

    if (!(timing > 0)) { // Handle NaN, etc.
      const naAuditProduct = auditNotApplicable.NoAdRendered;
      naAuditProduct.runWarnings = [runWarning.NoAdRendered];
      return naAuditProduct;
    }

    const scoreOptions = context.options[
        context.settings.throttlingMethod == 'provided' ?
          'provided' :
          'simulate'
    ];

    return {
      numericValue: timing,
      numericUnit: 'millisecond',
      score: Audit.computeLogNormalScore(
        scoreOptions,
        timing,
      ),
      displayValue:
      str_(UIStrings.displayValue, {timeInMs: timing}),
    };
  }
}
export default FirstAdRender;
export {UIStrings};
