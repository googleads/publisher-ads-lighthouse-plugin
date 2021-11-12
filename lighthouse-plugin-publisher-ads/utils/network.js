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

// @ts-ignore
const CacheHeaders = require('lighthouse/lighthouse-core/audits/byte-efficiency/uses-long-cache-ttl.js');
// @ts-ignore
const {parse: parseCacheControl} = require('@tusbar/cache-control');

/**
 * @param {LH.Artifacts.NetworkRequest} req
 * @param {string} header
 * @return {{name: string, value: string}|undefined}
 */
function getHeader(req, header) {
  const lowerHeader = header.toLowerCase();
  return (req.responseHeaders || []).find(
    (h) => h.name.toLowerCase() === lowerHeader);
}

/**
 * Checks if a record is cacheable by clients.
 * @param {LH.Artifacts.NetworkRequest} req
 * @return {boolean}
 */
function isCacheable(req) {
  // Check resource type before headers.
  if (!CacheHeaders.isCacheableAsset(req)) {
    return false;
  }
  const cacheControlHeader = getHeader(req, 'cache-control');
  if (cacheControlHeader) {
    try {
      const cacheControl = parseCacheControl(cacheControlHeader.value);
      if (cacheControl.noStore || cacheControl.noCache ||
          cacheControl.maxAge === 0) {
        return false;
      }
    } catch (e) {/* Ignore parsing errors or missing headers. */}
    return true;
  }
  // Check for other cacheable headers.
  return !!getHeader(req, 'expires') || !!getHeader(req, 'last-modified');
}

module.exports = {
  isCacheable,
};
