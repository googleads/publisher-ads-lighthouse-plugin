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

import ComputedBidRequestTime from '../computed/bid-request-time.js';

import * as i18n from 'lighthouse/core/lib/i18n/i18n.js';
import {auditNotApplicable} from '../messages/common-strings.js';
import {Audit} from 'lighthouse';

const UIStrings = {
  title: 'First bid request time',
  failureTitle: 'Reduce time to send the first bid request',
  description: 'This metric measures the elapsed time from the start of page ' +
  'load until the first bid request is made. Delayed bid requests will ' +
  'decrease impressions and viewability, and have a negative impact on ad ' +
  'revenue. [Learn More](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/bid-request-from-page-start' +
  ').',
  displayValue: '{timeInMs, number, seconds} s',
};

const str_ = i18n.createIcuMessageFn(import.meta.url, UIStrings);

/**
 * Audit to determine time for first ad request relative to page start.
 */
class BidRequestFromPageStart extends Audit {
  /**
   * @return {LH.Audit.Meta}
   */
  static get meta() {
    return {
      id: 'bid-request-from-page-start',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      // @ts-ignore
      scoreDisplayMode: Audit.SCORING_MODES.NUMERIC,
      requiredArtifacts: ['devtoolsLogs', 'traces', 'URL', 'GatherContext'],
    };
  }

  /**
   * @return {{
    *  simulate: LH.Audit.ScoreOptions, provided: LH.Audit.ScoreOptions
    * }}
    */
  static get defaultOptions() {
    return {
      simulate: {
<<<<<<< HEAD
        p10: 4350,
        median: 8000,
      },
      provided: {
        p10: 1200,
        median: 2000,
=======
        // 75th & 95th percentile with simulation.
        scorePODR: 7500,
        scoreMedian: 15500,
        // Derived from the existing PODR and median points.
        p10: 8900,
      },
      provided: {
        scorePODR: 1500,
        scoreMedian: 3500,
        // Derived from the existing PODR and median points.
        p10: 1900,
>>>>>>> 45d51e7 (add p10 score-curve control points)
      },
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
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
    const scoreOptions = context.options[
        context.settings.throttlingMethod == 'provided' ?
          'provided' :
          'simulate'
    ];

    const {timing} = await ComputedBidRequestTime.request(metricData, context);
    if (!(timing > 0)) { // Handle NaN, etc.
      return auditNotApplicable.NoBids;
    }

    return {
      numericValue: timing,
      numericUnit: 'millisecond',
      score: Audit.computeLogNormalScore(
<<<<<<< HEAD
        scoreOptions,
        timing,
=======
        {p10: scoreOptions.p10, median: scoreOptions.scoreMedian},
        timing
>>>>>>> 45d51e7 (add p10 score-curve control points)
      ),
      displayValue: str_(UIStrings.displayValue, {timeInMs: timing}),
    };
  }
}

export default BidRequestFromPageStart;
export {UIStrings};
