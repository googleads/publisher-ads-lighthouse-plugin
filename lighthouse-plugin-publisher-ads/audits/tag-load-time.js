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

const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records');
const {auditNotApplicable} = require('../utils/builder');
const {AUDITS, NOT_APPLICABLE, WARNINGS} = require('../messages/messages');
const {Audit} = require('lighthouse');
const {formatMessage} = require('../messages/format');
const {getPageResponseTime, getPageStartTime, getTagEndTime} = require('../utils/network-timing');

const id = 'tag-load-time';
const {
  title,
  failureTitle,
  description,
  displayValue,
} = AUDITS[id];

// Point of diminishing returns.
const PODR = 1; // seconds
const MEDIAN = 1.5; // seconds
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
      requiredArtifacts: ['devtoolsLogs'],
    };
  }
  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts, context) {
    const devtoolsLogs = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const networkRecords = await NetworkRecords.request(devtoolsLogs, context);
    const pageStartTime = getPageStartTime(networkRecords);
    const pageResponseTime = getPageResponseTime(networkRecords);
    const tagEndTime = getTagEndTime(networkRecords);
    if (pageStartTime < 0) {
      return auditNotApplicable(NOT_APPLICABLE.NO_RECORDS);
    }
    if (tagEndTime < 0) {
      context.LighthouseRunWarnings.push(WARNINGS.NO_TAG);
      return auditNotApplicable(NOT_APPLICABLE.NO_TAG);
    }

    // NOTE: score is relative to page response time to avoid counting time for
    // first party rendering.
    let normalScore = Audit.computeLogNormalScore(
      tagEndTime - pageResponseTime, PODR, MEDIAN);

    // Results that have green text should be under passing category.
    if (normalScore >= .9) {
      normalScore = 1;
    }

    const tagLoadTime = (tagEndTime - pageStartTime);
    return {
      numericValue: tagLoadTime,
      score: normalScore,
      displayValue: formatMessage(displayValue, {tagLoadTime}),
    };
  }
}
module.exports = TagLoadTime;
