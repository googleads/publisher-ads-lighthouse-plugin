// @ts-ignore
const NetworkRecorder = require('lighthouse/lighthouse-core/lib/network-recorder');
const chromeHar = require('chrome-har');
const log = require('lighthouse-logger');
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
 * @param {HAR.Entry[]} harEntries
 * @param {LH.WebInspector.NetworkRequest[]} networkRecords
 * @return {HAR.Entry[]}
 */
function findMissingEntries(harEntries, networkRecords) {
  // NOTE: This doesn't handle cases where duplicate URLs appear fewer times in
  // Lighthouse because we dump the data into a Set.
  const lhUrls = new Set(networkRecords.map((r) => r.url));
  return harEntries.filter((entry) => !lhUrls.has(entry.request.url));
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
    // Listen for certain devtools events to be able to construct a HAR network
    // log.
    for (const method of METHODS_TO_OBSERVE) {
      /**
       * @param {string} params
       * @return {number}
       */
      const append = (params) => this.events_.push(
        /** @type {LH.Protocol.RawEventMessage} */ ({method, params}));
      await passContext.driver.on(method, append);
    }
  }

  /**
   * @param {LH.Gatherer.PassContext} passContext
   * @param {LH.Gatherer.LoadData} loadData
   * @return {Promise<NetworkArtifacts>}
   * @override
   */
  async afterPass(passContext, loadData) {
    const events = this.events_.slice();
    log.log('Debug', 'Network: Get trace snapshot');

    const har = chromeHar.harFromMessages(events);
    const networkRecords = await NetworkRecorder.recordsFromLogs(events);
    const parsedUrls = har.log.entries.map((e) => new URL(e.request.url));

    if (isDebugMode()) {
      findMissingEntries(har.log.entries, networkRecords).forEach((entry) => {
        log.warn('Debug', 'Missing URL', entry.request.url.substr(0, 100));
      });
    }

    return {har, networkRecords, parsedUrls};
  }
}

module.exports = Network;
