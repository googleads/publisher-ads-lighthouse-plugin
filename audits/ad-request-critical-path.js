const {auditNotApplicable} = require('../utils/builder');
const {Audit} = require('lighthouse');
const {isGoogleAds, hasAdRequestPath} = require('../utils/resource-classification');
const {URL} = require('url');

/**
 * Finds the critical path and the number of items blocking gpt by using
 * iterative depth-first search. Generates a set of resources blocking gpt, as
 * well as a deconstructed tree to show the relationship between resources
 * (where X is a child of Y if X blocks Y). A node will appear multiple
 * times in the tree if it has multiple parents (i.e. if the underlying
 * dependency graph is not a tree).
 * To illustrate with an example, if Node A and Node B both depend on Node C,
 * Node A would point to an instance of Node C, and Node B would point to an
 * instance of Node C, rather than A and B pointing to one copy of C.
 * @param {LH.Artifacts.NetworkRequest} startingEntry
 * @param {Array<LH.Artifacts.NetworkRequest>} networkRecords
 * @return {{blockedRequests: Set<string>, treeRootNode: RequestTree.TreeNode}}
 */
function findCriticalPath(startingEntry, networkRecords) {
  // TODO(bencatarevas): Find a data structure that can contain the DAG for the
  // stack. Also, determine a way to find the height of the DAG.

  /** @type {Set<string>} */ const blockedRequests = new Set();
  const treeRootNode = createNode(startingEntry.url);

  /** @type {Array<{name: string, children: Array<RequestTree.TreeNode>}>} */
  const stack = [treeRootNode];
  /** @type {Map<string, LH.Artifacts.NetworkRequest>} */
  const recordMap = new Map();

  /** @type {Set<string>} */
  // Container to hold all visited edges of the dependency tree. This is to
  // avoid either ignoring a repeated value that we want to add, or adding an
  // unwanted repeated value to the tree.
  const visitedEdges = new Set();

  for (const entry of networkRecords) {
    recordMap.set(entry.url, entry);
  }

  while (stack.length) {
    const parentNode = /** @type {RequestTree.TreeNode} */ (stack.pop());
    blockedRequests.add(parentNode.name);

    // Something to note here is that the check below serves two purposes.
    // The first is for checking if the URLs match. The second is for checking
    // whether we've reached the root domain. We don't actually add the root
    // domain to recordMap. Thus, we need to check if, when accessing the
    // recordMap, it returns undefined to see if we've reached the root domain.

    const currentEntry = recordMap.get(parentNode.name);
    if (!currentEntry) {
      continue;
    }
    for (const callFrame of getCallFrames(currentEntry)) {
      // Concatenation of urls to store in set. We cannot store objects because
      // Sets check reference equality for objects, not value equality.
      const relationship = parentNode.name + callFrame.url;
      const hasVisitedEdge = visitedEdges.has(relationship);

      if (!hasVisitedEdge) {
        const newChildNode = createNode(callFrame.url);
        parentNode.children.push(newChildNode);
        visitedEdges.add(relationship);
        blockedRequests.add(callFrame.url);
        stack.push(newChildNode);
      }
    }
  }

  return {blockedRequests, treeRootNode};
}

/**
 * Returns the entry's callstack. Default to empty if array not applicable
 * (i.e. initiator type is not "script").
 * @param {LH.Artifacts.NetworkRequest} entry
 * @return {LH.Crdp.Network.stack.callFrames}
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
 * @param {LH.Artifacts.NetworkRequest} entry
 * @return {LH.Crdp.Network.Initiator}
 */
function getInitiatorDetails(entry) {
  if (!entry.initiator) {
    return {
      type: '',
    };
  }
  return /** @type {LH.Crdp.Network.Initiator} */ (entry.initiator);
}

/**
 * Generates a TreeNode object.
 * @param {string} url
 * @return {RequestTree.TreeNode}
 */
function createNode(url) {
  return {
    name: url,
    children: [],
  };
}

/**
 * Audit to check the length of the critical path to load ads.
 * Also determines the critical path for visualization purposes.
 */
class AdRequestCriticalPath extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id: 'ad-request-critical-path',
      title: 'Ad request critical path',
      description: 'These are the resources that block the first ad request. ' +
          'Consider reducing the number of resources or improving their ' +
          'execution to start loading ads as soon as possible.',
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
    const adsEntries = networkRecords.filter((entry) => {
      const parsedUrl = new URL(entry.url);
      return isGoogleAds(parsedUrl) && hasAdRequestPath(parsedUrl);
    });

    if (!adsEntries.length) {
      return auditNotApplicable('No ads requested');
    }

    // We assume that the first entry in adsEntries will be the first ad
    // request. When testing, the numbers match using adsEntries[0].
    const {blockedRequests, treeRootNode} = adsEntries.length ?
      findCriticalPath(adsEntries[0], networkRecords)
      : {blockedRequests: new Set(), treeRootNode: {}};
    const numBlocked = blockedRequests.size;

    const pluralEnding = numBlocked == 1 ? '' : 's';

    return {
      rawValue: numBlocked,
      score: numBlocked > 2 ? 0 : 1,
      displayValue: numBlocked > 2 ?
        `${numBlocked} resource${pluralEnding}` : '',
      details: {
        numBlocked,
        treeRootNode,
      },
    };
  }
}

module.exports = AdRequestCriticalPath;
