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

const {hasAdRequestPath, isGoogleAds, isImplTag} = require('./resource-classification');
const {URL} = require('url');

/**
 * Returns end time of tag load (s) relative to system boot.
 * @param {LH.Artifacts.NetworkRequest[]} networkRecords
 * @return {number}
 */
function getTagEndTime(networkRecords) {
  const tagRecord = networkRecords.find(
    (record) => isImplTag(new URL(record.url)));
  return tagRecord ? tagRecord.endTime : -1;
}

/**
 * Returns start time of first ad request (s) relative to system boot.
 * @param {LH.Artifacts.NetworkRequest[]} networkRecords
 * @return {number}
 */
function getAdStartTime(networkRecords) {
  const firstAdRecord = networkRecords.find(
    (record) => hasAdRequestPath(new URL(record.url)) &&
       record.url.includes('vrg'));
  return firstAdRecord ? firstAdRecord.startTime : -1;
}

/**
 * Returns start time of page load (s) relative to system boot.
 * @param {LH.Artifacts.NetworkRequest[]} networkRecords
 * @param {number=} defaultValue
 * @return {number}
 */
function getPageStartTime(networkRecords, defaultValue = -1) {
  const fistSuccessRecord = networkRecords.find(
    (record) => record.statusCode == 200);
  return fistSuccessRecord ? fistSuccessRecord.startTime : defaultValue;
}

/**
 * Returns the entry's call stack. Default to empty if array not applicable
 * (i.e. initiator type is not "script").
 * @param {LH.Artifacts.NetworkRequest} entry
 * @return {Array<string>}
 */
function getCallerScripts(entry) {
  const initiatorDetails = getInitiatorDetails(entry);
  if (!initiatorDetails.stack || initiatorDetails.type !== 'script') {
    return [];
  }
  // @ts-ignore
  return initiatorDetails.stack.callFrames.map((f) => f.url);
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
 * @param {Array<LH.Artifacts.NetworkRequest>} networkRequests
 * @param {Array<{content: string, requestId?: string}>} scriptElements
 * @return {?Set<LH.Artifacts.NetworkRequest>}
 */
function getAdLoadingGraph(networkRequests, scriptElements) {
  const pageStartTime = getPageStartTime(networkRequests);
  const adStartTime = getAdStartTime(networkRequests);

  /** @type {string[]} */
  const requestStack = [];

  const adRequests = networkRequests.filter((r) => {
    const parsedUrl = new URL(r.url);
    return isGoogleAds(parsedUrl) && hasAdRequestPath(parsedUrl);
  });
  if (!adRequests.length) {
    return null;
  }

  requestStack.push(...adRequests.map((r) => r.url));

  const adTags = scriptElements.filter(
    (script) => script.content.match(/googletag[.](cmd|display|pubads)/));
  for (const {requestId} of adTags) {
    const tagReq = networkRequests.find((r) => r.requestId === requestId);
    if (!tagReq) {
      continue;
    }
    requestStack.push(tagReq.url);
  }

  const result = new Set();
  const visited = new Set();
  while (requestStack.length) {
    const url = requestStack.pop();
    if (!url || visited.has(url)) {
      continue;
    }
    visited.add(url);
    const request = networkRequests.find((r) => r.url === url);
    if (!request || request.startTime <= pageStartTime ||
        request.endTime > adStartTime) {
      continue;
    }
    result.add(request);

    for (const caller of getCallerScripts(request)) {
      requestStack.push(caller);
    }
    requestStack.push(
        request.initiatorRequest && request.initiatorRequest.url);

    if (request.resourceType == 'Script') {
      /** @type {Array<LH.Artifacts.NetworkRequest>} */
      const initiatedRequests = networkRequests
          .filter((r) =>
            ['Script', 'Fetch', 'XHR', 'EventStream'].includes(r.resourceType))
          .filter((r) =>
              // TODO(warrengm): Refine the classification logic here. We don't
              // want to include all initiated requests in case this request is
              // do-all script, but this set is too restrictive currently.
              (/\b((pre)?bid|ad|exchange|rtb)/).test(url + r.url))
          .filter((r) =>
            r.initiatorRequest && r.initiatorRequest.url === url ||
              getCallerScripts(r).find((u) => u === url));
      for (const {url: initiatedUrl} of initiatedRequests) {
        requestStack.push(initiatedUrl);
      }
    }
  }
  return result;
}

module.exports = {
  getTagEndTime,
  getAdStartTime,
  getPageStartTime,
};
