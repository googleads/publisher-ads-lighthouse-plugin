const chromeHar = require('chrome-har');
const log = require('lighthouse-logger');
const {Gatherer} = require('lighthouse');
const {isDebugMode} = require('../index');
const {URL} = require('url');

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
 * @param {LH.Artifacts.NetworkRequest[]} networkRecords
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
    this.devtoolsEvents_ = [];
  }

  /**
   * @param {LH.Gatherer.PassContext} passContext
   * @override
   */
  async beforePass(passContext) {
    await Promise.all(METHODS_TO_OBSERVE.map(async (method) => {
      /** @param {string} params */
      const queueEvent = (params) => {
        const typedMessage =
          /** @type {LH.Protocol.RawEventMessage} */ ({method, params});
        this.devtoolsEvents_.push(typedMessage);
      };
      await passContext.driver.on(method, queueEvent);
    }));
  }

  /**
   * @param {LH.Gatherer.PassContext} passContext
   * @param {LH.Gatherer.LoadData} loadData
   * @return {Promise<NetworkArtifacts>}
   * @override
   */
  async afterPass(passContext, loadData) {
    /** @type {Array<LH.Protocol.RawEventMessage>} */
    const networkEvents = this.devtoolsEvents_.slice();
    log.log('Debug', 'Network: Get trace snapshot');

    const har = chromeHar.harFromMessages(networkEvents);
    const parsedUrls = har.log.entries.map((e) => new URL(e.request.url));

    if (isDebugMode()) {
      // These entries are present in our network artifacts, but are missing in
      // the builtin loadData network records.
      const missingEntries =
          findMissingEntries(har.log.entries, loadData.networkRecords);
      missingEntries.forEach((entry) => {
        log.warn('Debug', 'Missing URL', entry.request.url.substr(0, 100));
      });
    }
    return {har, networkEvents, parsedUrls};
  }
}

module.exports = Network;
