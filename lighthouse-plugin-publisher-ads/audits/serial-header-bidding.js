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

const NetworkRecords = require('lighthouse/lighthouse-core/computed/network-records');
const {auditNotApplicable} = require('../utils/builder');
const {AUDITS, NOT_APPLICABLE} = require('../messages/messages');
const {Audit} = require('lighthouse');
const {bucket} = require('../utils/array');
const {getTimingsByRecord} = require('../utils/network-timing');
const {isCacheable} = require('../utils/network');
const {isGoogleAds, getHeaderBidder} = require('../utils/resource-classification');
const {URL} = require('url');

/** @typedef {LH.Artifacts.NetworkRequest} NetworkRequest */
/** @typedef {LH.Gatherer.Simulation.NodeTiming} NodeTiming */

const id = 'serial-header-bidding';
const {
  title,
  failureTitle,
  description,
  headings,
} = AUDITS[id];

// Min record duration (s) to be considered a bid.
const MIN_BID_DURATION = .05;

/**
 * @typedef {Object} BidRequest
 * @property {string | boolean} bidder
 * @property {string} url
 * @property {number} startTime
 * @property {number} endTime
 * @property {number} duration
 */

/**
 * Table headings for audits details sections.
 * @type {LH.Audit.Details.Table['headings']}
 */
const HEADINGS = [
  {key: 'bidder', itemType: 'text', text: headings.bidder},
  {key: 'url', itemType: 'url', text: headings.url},
  {key: 'startTime', itemType: 'ms', text: headings.startTime},
  {key: 'endTime', itemType: 'ms', text: headings.endTime},
  {key: 'duration', itemType: 'ms', text: headings.duration},
];

/**
 * Enum for type of request.
 * @readonly
 * @enum {string}
 */
const RequestType = {
  AD: 'ad',
  BID: 'bid',
  UNKNOWN: 'unknown',
};

/**
 * Makes shallow copy of records.
 * @param {Array<LH.Artifacts.NetworkRequest>} records
 * @param {string} recordType
 * @param {Map<NetworkRequest, NodeTiming>} timings
 * @return {Array<NetworkDetails.RequestRecord>}
 */
function constructRecords(records, recordType, timings) {
  /** @type {NetworkDetails.RequestRecord[]} */
  const results = [];
  for (const record of records) {
    const timing = timings.get(record);
    if (!timing) continue;
    results.push(Object.assign({}, timing, {
      url: record.url,
      type: recordType,
    }));
  }
  return results;
}

/**
 * Checks the type of record.
 * @param {LH.Artifacts.NetworkRequest} record
 * @return {string}
 */
function checkRecordType(record) {
  if (isGoogleAds(new URL(record.url))) {
    return RequestType.AD;
  } else if (getHeaderBidder(record.url)) {
    return RequestType.BID;
  } else {
    return RequestType.UNKNOWN;
  }
}

/**
 * Filter out requests without responses, image responses, and responses
 * taking less than 50ms.
 * @param {LH.Artifacts.NetworkRequest} rec
 * @return {boolean}
 */
function isPossibleBid(rec) {
  return (rec.resourceSize == null || rec.resourceSize > 0) &&
      (rec.resourceType != 'Image') &&
      (rec.endTime - rec.startTime >= MIN_BID_DURATION) &&
      !isCacheable(rec);
}

/**
 * Returns a copy of the given urls with the query string removed, if present.
 * @param {string} url
 * @return {string}
 */
function clearQueryString(url) {
  const u = new URL(url);
  delete u.search;
  return u.toString();
}


/**
 * Audit to check if serial header bidding occurs
 */
class SerialHeaderBidding extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id,
      title,
      failureTitle,
      description,
      requiredArtifacts: ['devtoolsLogs', 'traces'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts, context) {
    const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const trace = artifacts.traces[Audit.DEFAULT_PASS];
    const unfilteredNetworkRecords =
    await NetworkRecords.request(devtoolsLog, context);

    // Filter out requests without responses, image responses, and responses
    // taking less than 50ms.
    const networkRecords = unfilteredNetworkRecords
        .filter(isPossibleBid);

    // We filter for URLs that are related to header bidding.
    // Then we create shallow copies of each record. This is because the records
    // by default have circular structure, which causes an error to be thrown
    // when we return them unmodified in the details field of the audit.
    // So, we create objects that only have the relevant information, and return
    // in the details field.
    const recordsByType = bucket(networkRecords, checkRecordType);

    if (!recordsByType.has(RequestType.BID)) {
      return auditNotApplicable(NOT_APPLICABLE.NO_BIDS);
    }

    /** @type {Map<NetworkRequest, NodeTiming>} */
    const timingsByRecord = await getTimingsByRecord(
      trace, devtoolsLog, context);

    const headerBiddingRecords = constructRecords(
      recordsByType.get(RequestType.BID) || [], RequestType.BID,
      timingsByRecord);
    /** @type {NetworkDetails.RequestRecord[]} */ let serialBids = [];
    let previousBid;

    for (const record of headerBiddingRecords) {
      record.bidder = getHeaderBidder(record.url);
      record.url = clearQueryString(record.url);

      if (previousBid && record.startTime >= previousBid.endTime) {
        serialBids.push(previousBid);
        serialBids.push(record);
      }
      if (!previousBid || record.endTime < previousBid.endTime ||
          record.startTime >= previousBid.endTime) {
        previousBid = record;
      }
    }

    // De-dupe bid requests.
    serialBids = Array.from(new Set(serialBids));

    // At least two bids must be serial w.r.t. each other.
    const hasSerialHeaderBidding = serialBids.length > 1;
    return {
      numericValue: Number(hasSerialHeaderBidding),
      score: hasSerialHeaderBidding ? 0 : 1,
      details: hasSerialHeaderBidding ?
        SerialHeaderBidding.makeTableDetails(HEADINGS, serialBids) : undefined,
    };
  }
}

module.exports = SerialHeaderBidding;
