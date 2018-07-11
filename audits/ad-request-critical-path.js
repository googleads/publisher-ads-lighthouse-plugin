const {isGoogleAds, hasAdRequestPath} = require('../utils/resource-classification');
const {Audit} = require('lighthouse');
const {URL} = require('url');

/**
 * Finds the critical path and the number of items blocking gpt by using
 * iterative depth-first search.
 * @param {HAR.Entry} startingEntry
 * @param {HAR.Har} har
 * @return {Set<string>}
 */
function findCriticalPath(startingEntry, har) {
  // TODO(bencatarevas): Find a data structure that can contain the DAG for the
  // stack. Also, determine a way to find the height of the DAG.

  /** @type {Set<string>} */ const blockedRequests = new Set();
  /** @type {Array<string>} */ const stack = [startingEntry.request.url];
  /** @type {Map<string, HAR.Entry>} */ const harMap = new Map();

  for (const entry of har.log.entries) {
    harMap.set(entry.request.url, entry);
  }

  while (stack.length) {
    const currentUrl = /** @type {string} */ (stack.pop());
    blockedRequests.add(currentUrl);

    // Something to note here is that the check below serves two purposes.
    // The first is for checking if the URLs match. The second is for checking
    // whether we've reached the root domain. We don't actually add the root
    // domain to harMap.Thus, we need to check if, when accessing the
    // harMap, it returns undefined to see if we've reached the root domain.

    const currentEntry = harMap.get(currentUrl);
    if (!currentEntry) {
      continue;
    }
    for (const callFrame of getCallFrames(currentEntry)) {
      const hasVisited = blockedRequests.has(callFrame.url);
      if (!hasVisited) {
        blockedRequests.add(callFrame.url);
        stack.push(callFrame.url);
      }
    }
  }

  return blockedRequests;
}

/**
 * Returns the entry's callstack. Default to empty if array not applicable
 * (i.e. initiator type is not "script").
 * @param {HAR.Entry} entry
 * @return {Array<HAR.CallFrame>}
 */
function getCallFrames(entry) {
  const initiatorDetails = getInitiatorDetails(entry);
  if (!initiatorDetails.stack || initiatorDetails.type !== 'script') {
    return [];
  }
  return initiatorDetails.stack.callFrames;
}

/**
 * Returns the entry's initiator details. Defaults to empty object with type
 * field if it has empty _initiator_detail, to keep in line with the structure
 * of _initiator_detail.
 * @param {HAR.Entry} entry
 * @return {HAR.Initiator}
 */
function getInitiatorDetails(entry) {
  if (!entry._initiator_detail) {
    return {
      type: '',
    };
  }
  return /** @type {HAR.Initiator} */ (JSON.parse(entry._initiator_detail));
}

/**
 * Audit to check the length of the critical path to load ads.
 * Also determines the critical path for visualization purposes.
 */
class AdRequestCriticalPath extends Audit {
  /**
   * @override
   * @return {AuditMetadata}
   */
  static get meta() {
    return {
      id: 'ad-request-critical-path',
      title: 'Ad request critical path',
      description: 'These are the resources that block the first ad request. ' +
          'Consider reducing the number of resources or improving their ' +
          'execution to start loading ads as soon as possible.',
      requiredArtifacts: ['Network'],
    };
  }

  /**
   * @param {Artifacts} artifacts
   * @return {LH.Audit.Product}
   */
  static audit(artifacts) {
    const {har} = artifacts.Network;

    const adsEntries = har.log.entries.filter((entry) => {
      const parsedUrl = new URL(entry.request.url);
      return isGoogleAds(parsedUrl) && hasAdRequestPath(parsedUrl);
    });

    // We assume that the first entry in adsEntries will be the first ad
    // request. When testing, the numbers match using adsEntries[0].
    const blockedRequests = adsEntries.length ?
      findCriticalPath(adsEntries[0], har) : new Set();
    const numBlocked = blockedRequests.size;

    return {
      rawValue: numBlocked,
      score: numBlocked > 2 ? 0 : 1,
      displayValue: `${numBlocked} resource(s) block ads`,
      details: {
        numBlocked,
        blockedRequests,
      },
    };
  }
}

module.exports = AdRequestCriticalPath;
