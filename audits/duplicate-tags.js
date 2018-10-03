const {auditNotApplicable} = require('../utils/builder');
const {Audit} = require('lighthouse');
const {containsAnySubstring} = require('../utils/resource-classification');

const tags = [
  'googletagservices.com/tag/js/gpt.js',
  'pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
  'imasdk.googleapis.com/js/sdkloader/ima3.js',
  'google-analytics.com/analytics.js',
];

/**
 * Table headings for audits details sections.
 * @type {LH.Audit.Heading[]}
 */
const HEADINGS = [
  {key: 'url', itemType: 'url', text: 'Script'},
  {key: 'numReqs', itemType: 'text', text: 'Duplicate Requests'},
  {key: 'frameId', itemType: 'text', text: 'Frame ID'},
];
/**
 * Simple audit that checks if any specified tags are duplicated within the same
 * frame.
 */
class DuplicateTags extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id: 'duplicate-tags',
      title: 'No duplicate tags are loaded in any frame',
      failureTitle: 'There are duplicate tags loaded in the same frame',
      description: 'Loading a tag more than once in the same frame is ' +
        'redundant and adds overhead without benefit.',
      requiredArtifacts: ['devtoolsLogs'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts) {
    const devtoolsLogs = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const networkRecords = await artifacts.requestNetworkRecords(devtoolsLogs);
    const tagReqs = networkRecords
        .filter((record) => containsAnySubstring(record.url, tags));

    if (!tagReqs.length) {
      return auditNotApplicable('No tags requested.');
    }

    const tagsByFrame = {};
    tagReqs.forEach((record) => {
      const frameId = record.frameId;
      // Ignores protocol, is tested in other audit.
      const url = record.url.split('://')[1];
      if (!tagsByFrame[frameId]) {
        tagsByFrame[frameId] = {};
      }
      tagsByFrame[frameId][url] =
          tagsByFrame[frameId][url] ? tagsByFrame[frameId][url] + 1 : 1;
    });

    /** @type {{[x: string]: LH.Audit.DetailsItem}[]} */
    const dups = [];
    for (const frameId of Object.keys(tagsByFrame)) {
      for (const url of Object.keys(tagsByFrame[frameId])) {
        const numReqs = tagsByFrame[frameId][url];
        if (numReqs > 1) {
          dups.push({url, numReqs, frameId});
        }
      }
    }

    const pluralEnding = dups.length == 1 ? '' : 's';
    return {
      rawValue: dups.length,
      score: dups.length ? 0 : 1,
      details: DuplicateTags.makeTableDetails(HEADINGS, dups),
      displayValue: dups.length ?
        `${dups.length} duplicate tag${pluralEnding}` : '',
    };
  }
}

module.exports = DuplicateTags;
