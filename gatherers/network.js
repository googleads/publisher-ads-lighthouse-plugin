// @ts-ignore
const NetworkRecorder = require('lighthouse/lighthouse-core/lib/network-recorder');
const chromeHar = require('chrome-har');
const {Gatherer} = require('lighthouse');
const {URL} = require('url');
const {isDebugMode} = require('../index');

/** @type {Array<keyof LH.CrdpEvents>} */
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
 * Logs any missing URLs in loadData.
 * @param {Array<string>} urls
 * @param {LH.Gatherer.LoadData} loadData
 */
function logMissingUrls(urls, loadData) {
  if (!isDebugMode() || !loadData.networkRecords) return;

  // NOTE: This doesn't handle cases where duplicate URLs appear fewer times in
  // Lighthouse because we dump the data into a Set. This is OK for simple
  // logging.
  const lighthouseUrls = new Set(loadData.networkRecords.map((r) => r.url));
  const missingUrls = urls.filter((url) => !lighthouseUrls.has(url));
  for (const url of missingUrls) {
    // eslint-disable-next-line no-console
    console.log('[INFO] Missing URL in Lighthouse', url.substr(0, 120));
  }
}


/** @inheritdoc */
class Network extends Gatherer {
  /**
   * Initialize a Network Gatherer
   */
  constructor() {
    // @ts-ignore TypeScript produces an error when calling super()  here since
    // the compiler infers the type of Gatherer to be "any".
    super();

    /** @private @const @type {Array<LH.Protocol.RawEventMessage>} */
    this.events_ = [];
  }

  /**
   * @param {LH.Gatherer.PassContext} passContext
   * @override
   */
  async beforePass(passContext) {
    for (const method of METHODS_TO_OBSERVE) {
      // Add listener for each method.
      await passContext.driver.on(
        method, (params) => this.events_.push(
          /** @type {LH.Protocol.RawEventMessage} */ ({method, params})));
    }
  }

  /**
   * @param {LH.Gatherer.PassContext} passContext
   * @param {LH.Gatherer.LoadData} loadData
   * @return {Promise<NetworkArtifacts>}
   * @override
   */
  async afterPass(passContext, loadData) {
    // Use HAR data instead of Lighthouse load data since the Lighthouse network
    // log is missing some requests.
    // TODO(warrengm): Investigate why. Lighthouse *should* be correct.
    const har = chromeHar.harFromMessages(this.events_);
    const networkRecords = await NetworkRecorder.recordsFromLogs(this.events_);
    const urls = har.log.entries.map((entry) => entry.request.url);
    const parsedUrls = urls.map((url) => new URL(url));
    logMissingUrls(urls, loadData);
    return {har, networkRecords, parsedUrls};
  }
}

module.exports = Network;
