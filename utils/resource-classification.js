
/**
 * Checks if the url is from a Google ads host.
 * @param {!URL} url
 * @return {boolean}
 */
function isGoogleAds(url) {
  return /(^|\.)doubleclick.net$/.test(url.hostname) ||
      /(^|\.)googlesyndication.com$/.test(url.hostname);
}

/**
 * Checks if the url has an ad request path.
 * @param {!URL} url
 * @return {boolean}
 */
function hasAdRequestPath(url) {
  return url.pathname ==='/gampad/ads';
}

/**
 * Checks if the url has an impression path.
 * @param {!URL} url
 * @return {boolean}
 */
function hasImpressionPath(url) {
  return url.pathname ==='/pcs/view' ||
      url.pathname ==='/pagead/adview';
}

module.exports = {
  isGoogleAds,
  hasAdRequestPath,
  hasImpressionPath,
};
