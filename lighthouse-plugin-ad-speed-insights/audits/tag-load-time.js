// Copyright 2018 Google LLC
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

const ComputedTagLoadTime = require('../computed/tag-load-time');
const util = require('util');
const {auditNotApplicable} = require('../utils/builder');
const {AUDITS, NOT_APPLICABLE} = require('../messages/messages.js');
const {Audit} = require('lighthouse');

const id = 'tag-load-time';
const {
  title,
  failureTitle,
  description,
  displayValue,
} = AUDITS[id];

// Point of diminishing returns.
const PODR = 1; // seconds
const MEDIAN = 2; // seconds

/**
 * Audit to determine time for tag to load relative to page start.
 */
class TagLoadTime extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id,
      title,
      failureTitle,
      description,
      // @ts-ignore
      scoreDisplayMode: Audit.SCORING_MODES.NUMERIC,
      requiredArtifacts: ['devtoolsLogs', 'traces'],
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
    const metricData = {trace, devtoolsLog, settings: context.settings};

    const {timing} = await ComputedTagLoadTime.request(metricData, context);
    if (timing < 0) {
      return auditNotApplicable(NOT_APPLICABLE.NO_TAG);
    }

    const tagLoadTimeSec = timing / 1000;

    // NOTE: score is relative to page response time to avoid counting time for
    // first party rendering.
    let normalScore = Audit.computeLogNormalScore(tagLoadTimeSec, PODR, MEDIAN);

    // Results that have green text should be under passing category.
    if (normalScore >= .9) {
      normalScore = 1;
    }

    return {
      numericValue: tagLoadTimeSec,
      score: normalScore,
      displayValue: util.format(displayValue, tagLoadTimeSec.toFixed(2)),
    };
  }
}
module.exports = TagLoadTime;
