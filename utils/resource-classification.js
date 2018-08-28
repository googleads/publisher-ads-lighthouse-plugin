
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
 * Checks if the url has an ad request path.
 * @param {URL} url
 * @return {boolean}
 */
function hasAdRequestPath(url) {
  return url.pathname ==='/gampad/ads';
}

/**
 * Checks if the url has an impression path.
 * @param {URL} url
 * @return {boolean}
 */
function hasImpressionPath(url) {
  return url.pathname ==='/pcs/view' ||
      url.pathname ==='/pagead/adview';
}

/** Checks if the url is for an ad tag. */
const isAdTag = isGpt;

/**
 * Checks if the url is loading a gpt.js script
 * @param {URL} url
 * @return {boolean}
 */
function isGpt(url) {
  return url.host === 'www.googletagservices.com' &&
      url.pathname === '/tag/js/gpt.js';
}

/**
 * Checks if the url is loaded over http
 * @param {URL} url
 * @return {boolean}
 */
function isHttp(url) {
  return url.protocol === 'http:';
}

/**
 * Checks if the url is loaded over https
 * @param {URL} url
 * @return {boolean}
 */
function isHttps(url) {
  return url.protocol === 'https:';
}

module.exports = {
  isGoogleAds,
  hasAdRequestPath,
  hasImpressionPath,
  isAdTag,
  isGpt,
  isHttp,
  isHttps,
  isImplTag,
};
