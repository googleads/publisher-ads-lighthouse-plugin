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
const log = require('lighthouse-logger');
const {Audit} = require('lighthouse');
const {isGpt} = require('../utils/resource-classification');

const UIStrings = {
  title: 'Deprecated GPT API Usage',
  failureTitle: 'Reduce deprecated GPT API usage',
  description: 'Measures occurences of deprecated GPT API usage based on log messages. ' +
  'Reducing deprecated API usage can prevent errors which may impact user experience.',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

/** @typedef {{ignoredPatterns?: Array<RegExp|string>}} AuditOptions */

/**
 * Audit that checks for the presence of warning and error messages which
 * pertain to deprecated API usage.
 */
class DeprecatedApiUsage extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id: 'deprecated-gpt-api-usage',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      requiredArtifacts: ['ConsoleMessages'],
    };
  }

  /** @return {AuditOptions} */
  static defaultOptions() {
    return {};
  }

  /**
   * @template {{description: string | undefined}} T
   * @param {Array<T>} items
   * @param {AuditOptions} options
   * @return {Array<T>}
   */
  static filterAccordingToOptions(items, options) {
    const {ignoredPatterns, ...restOfOptions} = options;
    const otherOptionKeys = Object.keys(restOfOptions);
    if (otherOptionKeys.length) log.warn(this.meta.id, 'Unrecognized options');
    if (!ignoredPatterns) return items;

    return items.filter(({description}) => {
      if (!description) return true;
      for (const pattern of ignoredPatterns) {
        if (pattern instanceof RegExp && pattern.test(description)) {
          return false;
        }
        if (typeof pattern === 'string' && description.includes(pattern)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {LH.Audit.Product}
   */
  static audit(artifacts, context) {
    /** @type {AuditOptions} */
    const auditOptions = context.options;

    /** @type {Array<{
     * source: string,
     * description: string|undefined,
     * url: string|undefined}>} */
    const consoleRows = artifacts.ConsoleMessages
        .filter((item) => item.level === 'warning' || item.level === 'error')
        .filter((item) => item.url && isGpt(item.url))
        .filter((item) => item.text.toLowerCase().includes('deprecated'))
        .map((item) => ({
          source: item.source,
          description: item.text,
          url: item.url,
        }));

    const tableRows =
      DeprecatedApiUsage.filterAccordingToOptions(consoleRows, auditOptions)
          .sort((a, b) => (a.description || '').localeCompare(b.description || ''));

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

module.exports = DeprecatedApiUsage;
module.exports.UIStrings = UIStrings;
