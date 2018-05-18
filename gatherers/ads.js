const array = require('../utils/array.js');
// @ts-ignore
const chromeHar = require('chrome-har');
const {Gatherer} = require('lighthouse');

const METHODS_TO_OBSERVE = [
  'Page.loadEventFired',
  'Page.domContentEventFired',
  'Page.frameStartedLoading',
  'Page.frameAttached',
  'Network.requestWillBeSent',
  'Network.requestServedFromCache',
  'Network.dataReceived',
  'Network.responseReceived',
  'Network.resourceChangedPriority',
  'Network.loadingFinished',
  'Network.loadingFailed',
];

/**
 * @typedef {{
 *   message: string,
 *   params: !Object,
 * }}
 */
let DevToolsEvent;

/**
 * Checks if the url is from a Google ads host.
 * @param {string} url
 * @return {boolean}
 */
function isGoogleAds(url) {
  return /^https?:\/\/[\w.]+(doubleclick.net|googlesyndication.com)/.test(url);
}

/**
 * Checks if the url has an ad request path.
 * @param {string} url
 * @return {boolean}
 */
function hasAdRequestPath(url) {
  return url.includes('/gampad/ads?');
}

/**
 * Checks if the url has an impression path.
 * @param {string} url
 * @return {boolean}
 */
function hasImpressionPath(url) {
  return url.includes('/pcs/view?') || url.includes('/pagead/adview?');
}

/**
 * Logs any missing URLs in loadData.
 * @param {!Array<string>} urls
 * @param {!LH.Gatherer.LoadData} loadData
 */
function logMissingUrls(urls, loadData) {
  if (!loadData.networkRecords) return;

  // NOTE: This doesn't handle cases where duplicate URLs appear fewer times in
  // Lighthouse because we dump the data into a Set. This is OK for simple
  // logging.
  const lighthouseUrls = new Set(loadData.networkRecords.map((r) => r.url));
  const missingUrls = urls.filter((url) => !lighthouseUrls.has(url));
  for (const url of missingUrls) {
    console.log('[INFO] Missing URL in Lighthouse', url.substr(0, 120));
  }
}


class Ads extends Gatherer {
  constructor() {
    super();

    /** @private @const {!Array<!DevToolsEvent>} */
    this.events_ = [];
  }

  /** @override */
  async beforePass(passContext) {
    for (const method of METHODS_TO_OBSERVE) {
      // Add listener for each method.
      await passContext.driver.on(
          method, (params) => this.events_.push({method, params}));
    }
  };

  /** @override */
  async afterPass(passContext, loadData) {
    // Use HAR data instead of Lighthouse load data since the Lighthouse network
    // log is missing some requests.
    // TODO(warrengm): Investigate why. Lighthouse *should* be correct.
    const har = chromeHar.harFromMessages(this.events_);
    const urls = har.log.entries.map((entry) => entry.request.url);
    logMissingUrls(urls, loadData);

    const googleAdsEntries = urls.filter(isGoogleAds);
    const numRequests = array.count(googleAdsEntries, hasAdRequestPath);
    const numImpressions = array.count(googleAdsEntries, hasImpressionPath);
    return {numRequests, numImpressions};
  }
}

module.exports = Ads;
