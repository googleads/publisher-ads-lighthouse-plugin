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

const bidderPatterns = require('./bidder-patterns');
const {isCacheable} = require('../utils/network');
const {URL} = require('url');

/**
 * Converts the given url to a URL, if it's not already a URL. Otherwise returns
 * the same URL object (not a copy).
 * @param {URL|string} urlOrStr
 * @return {URL}
 */
function toURL(urlOrStr) {
  return (typeof urlOrStr === 'string') ? new URL(urlOrStr) : urlOrStr;
}

/**
 * Checks if the url is from a Google ads host.
 * @param {URL} url
 * @return {boolean}
 */
function isGoogleAds(url) {
  return /(^|\.)(doubleclick.net|google(syndication|tagservices).com)$/
      .test(url.hostname);
}

/**
 * Checks if the url is loading a gpt.js script.
 * @param {URL|string} url
 * @return {boolean}
 */
function isGptTag(url) {
  const {host, pathname} = toURL(url);
  const matchesHost = [
    'www.googletagservices.com',
    'securepubads.g.doubleclick.net'].includes(host);
  const matchesPath =
    ['/tag/js/gpt.js', '/tag/js/gpt_mobile.js'].includes(pathname);
  return matchesHost && matchesPath;
}

/**
 * Checks if the url is for pubads implementation tag.
 * @param {URL|string} url
 * @return {boolean}
 */
function isGptImplTag(url) {
  return /(^\/gpt\/pubads_impl_\d+.js)/.test(toURL(url).pathname);
}

/**
 * Checks if the url is loading a gpt.js or pubads_impl_*.js script.
 * @param {URL} url
 * @return {boolean}
 */
function isGpt(url) {
  return isGptTag(url) || isGptImplTag(url);
}

/**
 * Checks if a network request is a GPT ad request.
 * @param {LH.Artifacts.NetworkRequest} request
 * @return {boolean}
 */
function isGptAdRequest(request) {
  if (!request) return false;
  const url = new URL(request.url);
  return (
    url.pathname === '/gampad/ads' &&
    url.host === 'securepubads.g.doubleclick.net' &&
    request.resourceType === 'XHR'
  );
}

/**
 * @param {Artifacts['IFrameElement']} iframe
 * @return {boolean}
 */
function isGptIframe(iframe) {
  return /(^google_ads_iframe_)/.test(iframe.id);
}

/**
 * Checks if the url is loading an AdSense script.
 * @param {URL|string} url
 * @return {boolean}
 */
function isAdSenseTag(url) {
  const {host, pathname} = toURL(url);
  const matchesHost = [
    'pagead2.googlesyndication.com'].includes(host);
  const matchesPath =
      ['/pagead/js/adsbygoogle.js'].includes(pathname);
  return matchesHost && matchesPath;
}

/**
 * Checks if the url is loading an AdSense script. Kind of pointless since
 * AdSense doesn't have a separate loader, but provided anyway for symmetry with
 * isGpt().
 * @param {URL} url
 * @return {boolean}
 */
function isAdSense(url) {
  return isAdSenseTag(url);
}

/**
 * Checks if a network request is an AdSense ad request.
 * @param {LH.Artifacts.NetworkRequest} request
 * @return {boolean}
 */
function isAdSenseAdRequest(request) {
  if (!request) return false;
  const url = new URL(request.url);
  return (
    url.pathname === '/pagead/ads' &&
    url.host === 'googleads.g.doubleclick.net'
  );
}

/**
 * @param {Artifacts['IFrameElement']} iframe
 * @return {boolean}
 */
function isAdSenseIframe(iframe) {
  return /(^google_ads_frame)/.test(iframe.id);
}

/**
 * Checks if the url is loading either the GPT loader script or the AdSense
 * script.
 * @param {URL} url
 * @return {boolean}
 */
function isAdTag(url) {
  return isAdSenseTag(url) || isGptTag(url);
}

/**
 * Checks if a network request is a GPT or AdSense ad request.
 * @param {LH.Artifacts.NetworkRequest} request
 * @return {boolean}
 */
function isAdRequest(request) {
  return isAdSenseAdRequest(request) || isGptAdRequest(request);
}

/**
 * Checks if the url is loading either the GPT impl script or the AdSense
 * script.
 * @param {URL} url
 * @return {boolean}
 */
function isImplTag(url) {
  return isAdSenseTag(url) || isGptImplTag(url);
}

/**
 * Checks if str contains at least one provided substring.
 * @param {string} str
 * @param {Array<string>} substrings
 * @return {boolean}
 */
function containsAnySubstring(str, substrings) {
  return substrings.some((substring) => str.includes(substring));
}

/**
 * Checks if the url has an impression path.
 * @param {URL} url
 * @return {boolean}
 */
function hasImpressionPath(url) {
  return url.pathname === '/pcs/view' ||
      url.pathname === '/pagead/adview';
}

/**
 * Returns header bidder or undefined if not a bid.
 * @param {string} url
 * @return {string|undefined}
 */
function getHeaderBidder(url) {
  for (const def of bidderPatterns) {
    for (const pattern of def.patterns) {
      if (new RegExp(pattern).test(url)) {
        return def.label;
      }
    }
  }
  return undefined;
}

/**
 * Checks whether the given request is a bid request or related to bidding (e.g.
 * a bidding script).
 * @param {LH.Artifacts.NetworkRequest|string} requestOrUrl
 * @return {boolean}
 */
function isBidRelatedRequest(requestOrUrl) {
  return !!getHeaderBidder(
    typeof requestOrUrl == 'string' ? requestOrUrl : requestOrUrl.url);
}

/**
 * Checks the request to see if it meets requirements for bid requests.
 * @param {LH.Artifacts.NetworkRequest} req
 * @return {boolean}
 */
function isPossibleBidRequest(req) {
  return (req.resourceSize == null || req.resourceSize > 0) &&
      (req.resourceType != 'Image') &&
      !isCacheable(req);
}

/**
 * Checks the request to see if it's a bid request.
 * @param {LH.Artifacts.NetworkRequest} req
 * @return {boolean}
 */
function isBidRequest(req) {
  return isBidRelatedRequest(req) && isPossibleBidRequest(req);
}

/**
 * @param {LH.Artifacts.NetworkRequest} request
 * @return {boolean}
 */
function isStaticRequest(request) {
  // Use initiator type to determine if tag was loaded statically.
  return ['parser', 'preload', 'other'].includes(request.initiator.type);
}

/**
 * Removes the query string from the URL.
 * @param {string} url
 * @return {string}
 */
function trimUrl(url) {
  const u = new URL(url);
  const PATH_MAX = 60;
  const path = u.pathname.length > PATH_MAX ?
    u.pathname.substr(0, PATH_MAX) + '...' : u.pathname;
  return u.origin + path;
}

/**
 * Returns an abbreviated version of the URL, with a shortened path and no query
 * string.
 * @param {string} url
 * @return {string}
 */
function getAbbreviatedUrl(url) {
  const u = new URL(trimUrl(url));
  const parts = u.pathname.split('/');
  if (parts.length > 4) {
    u.pathname = [...parts.splice(0, 4), '...'].join('/');
  }
  return u.toString();
}

module.exports = {
  isGoogleAds,
  isGptTag,
  isGptImplTag,
  isGpt,
  isGptAdRequest,
  isGptIframe,
  isAdSense,
  isAdSenseTag,
  isAdSenseAdRequest,
  isAdSenseIframe,
  isAdTag,
  isAdRequest,
  isImplTag,
  containsAnySubstring,
  hasImpressionPath,
  getHeaderBidder,
  isBidRelatedRequest,
  isBidRequest,
  isStaticRequest,
  trimUrl,
  getAbbreviatedUrl,
};
