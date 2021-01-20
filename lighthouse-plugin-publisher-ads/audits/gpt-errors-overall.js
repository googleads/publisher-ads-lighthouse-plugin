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

const i18n = require('lighthouse/lighthouse-core/lib/i18n/i18n');
const {Audit} = require('lighthouse');
const {isGpt} = require('../utils/resource-classification');

const UIStrings = {
  title: 'GPT Errors',
  failureTitle: 'Fix GPT errors',
  description: 'Fix GPT errors to ensure your page is tagged as intended. ' +
  '[Learn more](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/gpt-errors-overall' +
  ').',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

/**
 * Audit that checks for the presence of errors and exceptions from the console
 * as well as other audits.
 */
class GptErrorsOverall extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id: 'gpt-errors-overall',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      requiredArtifacts: ['ConsoleMessages'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @return {LH.Audit.Product}
   */
  static audit(artifacts) {
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
      {key: 'url', itemType: 'url', text: str_(i18n.UIStrings.columnURL)},
      {key: 'description', itemType: 'code', text: str_(i18n.UIStrings.columnDescription)},
    ];

    const details = Audit.makeTableDetails(headings, tableRows);
    const numErrors = tableRows.length;

    return {
      score: Number(numErrors === 0),
      details,
    };
  }
}

module.exports = GptErrorsOverall;
module.exports.UIStrings = UIStrings;
