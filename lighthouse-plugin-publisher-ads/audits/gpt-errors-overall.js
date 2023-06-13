// Copyright 2021 Google LLC
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

import {NetworkRecords} from 'lighthouse/core/computed/network-records.js';
import {auditNotApplicable} from '../messages/common-strings.js';
import {Audit} from 'lighthouse';
import {isGpt, isGptImplTag} from '../utils/resource-classification.js';

const UIStrings = {
  title: 'GPT Errors',
  failureTitle: 'Fix GPT errors',
  description: 'Fix GPT errors to ensure your page is tagged as intended. ' +
  '[Learn more](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/gpt-errors-overall' +
  ').',
  displayValue: '{numErrors, plural, =1 {1 error} other {# errors}} found',
};

const str_ = i18n.createIcuMessageFn(import.meta.url, UIStrings);

/**
 * Audit that checks for the presence of errors and exceptions from the console
 * as well as other audits.
 */
class GptErrorsOverall extends Audit {
  /**
   * @return {LH.Audit.Meta}
   */
  static get meta() {
    return {
      id: 'gpt-errors-overall',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      scoreDisplayMode: 'informative',
      requiredArtifacts: ['ConsoleMessages', 'devtoolsLogs'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts, context) {
    const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const network = await NetworkRecords.request(devtoolsLog, context);

    const pubadsImpl = network.find((r) => isGptImplTag(r.url));
    if (!pubadsImpl) {
      return auditNotApplicable.NoGpt;
    }

    /** @type {Array<{
     * source: string,
     * description: string|undefined,
     * url: string|undefined}>} */
    const tableRows = artifacts.ConsoleMessages
        .filter((item) =>
          item.level === 'error' || item.level === 'warning')
        .filter((item) => item.url && isGpt(item.url))
        .filter((item) =>
          !item.text.toLowerCase().includes('deprecated') &&
          !item.text.toLowerCase().includes('discouraged'))
        .map((item) => ({
          source: item.source,
          description: item.text,
          url: item.url,
          timestamp: item.timestamp,
        }))
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    /** @type {LH.Audit.Details.Table['headings']} */
    const headings = [
      {key: 'url', valueType: 'url', label: str_(i18n.UIStrings.columnURL)},
      {key: 'description', valueType: 'code', label: str_(i18n.UIStrings.columnDescription)},
    ];

    const details = Audit.makeTableDetails(headings, tableRows);
    const numErrors = tableRows.length;

    return {
      score: Number(numErrors === 0),
      details,
      displayValue: str_(UIStrings.displayValue, {numErrors}),
    };
  }
}

export default GptErrorsOverall;
export {UIStrings};
