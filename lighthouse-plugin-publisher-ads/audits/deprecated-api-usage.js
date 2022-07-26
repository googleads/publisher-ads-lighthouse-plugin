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

import * as i18n from 'lighthouse/lighthouse-core/lib/i18n/i18n.js';

import NetworkRecords from 'lighthouse/lighthouse-core/computed/network-records.js';
import {auditNotApplicable} from '../messages/common-strings.js';
import {Audit} from 'lighthouse';
import {isGpt, isGptImplTag} from '../utils/resource-classification.js';

const UIStrings = {
  title: 'Deprecated GPT API Usage',
  failureTitle: 'Avoid deprecated GPT APIs',
  description: 'Deprecated GPT API methods should be avoided to ensure your ' +
  'page is tagged correctly. [Learn more](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/deprecated-gpt-api-usage' +
  ').',
  displayValue: '{numErrors, plural, =1 {1 error} other {# errors}} found',
};

const str_ = i18n.createMessageInstanceIdFn(import.meta.url, UIStrings);

/**
 * Audit that checks for the presence of warning and error messages which
 * pertain to deprecated API usage.
 */
class DeprecatedApiUsage extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * /override This member cannot have a JSDoc comment with an '@override' tag because its containing class ... does not extend another class.
   */
  static get meta() {
    return {
      id: 'deprecated-gpt-api-usage',
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
     * url: string|undefined,
     * timestamp: number|undefined}>} */
    const tableRows = artifacts.ConsoleMessages
        .filter((item) => item.level === 'warning' || item.level === 'error')
        .filter((item) => item.url && isGpt(item.url))
        .filter((item) =>
          item.text.toLowerCase().includes('deprecated') ||
          item.text.toLowerCase().includes('discouraged'))
        .map((item) => ({
          source: item.source,
          description: item.text,
          url: item.url,
          timestamp: item.timestamp,
        }))
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    /** @type {LH.Audit.Details.Table['headings']} */
    const headings = [
      {key: 'url', itemType: 'url', text: str_(i18n.UIStrings.columnURL)},
      {key: 'description', itemType: 'code', text: str_(i18n.UIStrings.columnDescription)},
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

export default DeprecatedApiUsage;
export {UIStrings};
