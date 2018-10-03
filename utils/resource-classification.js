
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
 * Checks if the url is for pubads implementation tag.
 * @param {URL} url
 * @return {boolean}
 */
function isImplTag(url) {
  return /(^\/gpt\/pubads_impl_\d+.js)/
      .test(url.pathname);
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
 * Checks if the url has an ad request path.
 * @param {URL} url
 * @return {boolean}
 */
function hasAdRequestPath(url) {
  return url.pathname === '/gampad/ads';
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
 * Checks if the url is loading a gpt.js script.
 * @param {URL} url
 * @return {boolean}
 */
function isGpt(url) {
  return url.host === 'www.googletagservices.com' &&
      url.pathname === '/tag/js/gpt.js';
}

module.exports = {
  isGoogleAds,
  hasAdRequestPath,
  hasImpressionPath,
  isGpt,
  isImplTag,
  containsAnySubstring,
};
