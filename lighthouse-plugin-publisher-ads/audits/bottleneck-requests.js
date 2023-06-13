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

import * as i18n from 'lighthouse/core/lib/i18n/i18n.js';

import {auditNotApplicable} from '../messages/common-strings.js';
import {Audit} from 'lighthouse';
import {computeAdRequestWaterfall} from '../utils/graph.js';
import {isAdScript, toURL} from '../utils/resource-classification.js';

/** @typedef {LH.Artifacts.NetworkRequest} NetworkRequest */
/** @typedef {import('../utils/graph.js').SimpleRequest} SimpleRequest */

const UIStrings = {
  title: 'No bottleneck requests found',
  failureTitle: 'Avoid bottleneck requests',
  description: 'Speed up, load earlier, parallelize, or eliminate the ' +
    'following requests and their dependencies in order to speed up ad ' +
    'loading. [Learn More](' +
    'https://developers.google.com/publisher-ads-audits/reference/audits/bottleneck-requests' +
    ').',
  displayValue: '{blockedTime, number, seconds} s spent blocked on requests',
  columnUrl: 'Blocking Request',
  columnInitiatorUrl: 'Initiator Request',
  columnStartTime: 'Start',
  columnSelfTime: 'Exclusive Time',
  columnDuration: 'Total Time',
};

const str_ = i18n.createIcuMessageFn(import.meta.url, UIStrings);


/**
 * Table headings for audits details sections.
 * @type {LH.Audit.Details.Table['headings']}
 */
const HEADINGS = [
  {
    key: 'url',
    valueType: 'url',
    label: str_(UIStrings.columnUrl),
  },
  {
    key: 'selfTime',
    valueType: 'ms',
    label: str_(UIStrings.columnSelfTime),
    granularity: 1,
  },
  {
    key: 'duration',
    valueType: 'ms',
    label: str_(UIStrings.columnDuration),
    granularity: 1,
  },
];


/**
 * Audits any bottlneck requests in the path of loading ads.
 */
class BottleneckRequests extends Audit {
  /**
   * @return {LH.Audit.Meta}
   */
  static get meta() {
    return {
      id: 'bottleneck-requests',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      requiredArtifacts: ['devtoolsLogs', 'traces', 'URL'],
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

    const waterfall =
      (await computeAdRequestWaterfall(
        trace, devtoolsLog, artifacts.URL, context))
          .filter((r) => r.startTime > 0);
    if (!waterfall.length) {
      return auditNotApplicable.NoAdRelatedReq;
    }
    const CRITICAL_SELF_TIME_MS = 250;
    const CRITICAL_DURATION_MS = 1000;
    /** @param {SimpleRequest} r @return {boolean} */
    const isBottleneck = (r) =>
      !isAdScript(toURL(r.url)) &&
      // eslint-disable-next-line max-len
      (r.selfTime > CRITICAL_SELF_TIME_MS || r.duration > CRITICAL_DURATION_MS);
    // selfTime is more costly than duration so weigh it more than duration.
    /** @param {SimpleRequest} r @return {number} */
    const cost = (r) => r.selfTime * 3 + r.duration;
    const criticalRequests = waterfall
        .filter(isBottleneck)
        .sort((a, b) => cost(b) - cost(a))
        // Only show the top critical requests for the sake of brevity.
        .slice(0, 5);
    const blockedTime =
      // @ts-ignore param types not inferred.
      criticalRequests.reduce((sum, r) => sum + r.selfTime, 0) / 1000;
    const failed = blockedTime * 1e3 > CRITICAL_SELF_TIME_MS * 4;

    for (const row of criticalRequests) {
      delete row.record; // Remove circular references before serialization.
    }
    return {
      numericValue: criticalRequests.length,
      numericUnit: 'unitless',
      score: failed ? 0 : 1,
      displayValue: failed ? str_(UIStrings.displayValue, {blockedTime}) : '',
      details:
        // @ts-expect-error
        BottleneckRequests.makeTableDetails(HEADINGS, criticalRequests),
    };
  }
}

export default BottleneckRequests;
export {UIStrings};
