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
const {AUDITS, NOT_APPLICABLE} = require('../messages/messages.js');
const {Audit} = require('lighthouse');
const {bucket} = require('../utils/array');
const {getPageStartTime} = require('../utils/network-timing');
const {isGoogleAds, getHeaderBidder} = require('../utils/resource-classification');
const {URL} = require('url');

const id = 'serial-header-bidding';
const {
  title,
  failureTitle,
  description,
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
  {key: 'bidder', itemType: 'text', text: 'Bidder'},
  {key: 'url', itemType: 'url', text: 'URL'},
  {key: 'startTime', itemType: 'ms', text: 'Start Time'},
  {key: 'endTime', itemType: 'ms', text: 'End Time'},
  {key: 'duration', itemType: 'ms', text: 'Duration'},
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
 * @param {number} originTime
 * @return {Array<NetworkDetails.RequestRecord>}
 */
function constructRecords(records, recordType, originTime) {
  return records.map((record) => ({
    // We offset the start time so that the origin can be relative.
    // Previously, it was at an extremely high value.
    startTime: record.startTime - originTime,
    endTime: record.endTime - originTime,
    url: record.url,
    type: recordType,
  }));
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
function isValidRecord(rec) {
  return (rec.resourceSize == null || rec.resourceSize > 0) &&
      (rec.resourceType != 'Image') &&
      (rec.endTime - rec.startTime >= MIN_BID_DURATION);
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
      requiredArtifacts: ['devtoolsLogs'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts, context) {
    const devtoolsLogs = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const unfilteredNetworkRecords =
    await NetworkRecords.request(devtoolsLogs, context);

    // Filter out requests without responses, image responses, and responses
    // taking less than 50ms.
    const networkRecords = unfilteredNetworkRecords
        .filter(isValidRecord);

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

    // networkRecords are sorted by start time. We use this to offset
    // the visualized records.
    const timeOffset = getPageStartTime(unfilteredNetworkRecords, 0);

    // Construct shallow copies of records. If no records are found, return [].
    const adsRecords = constructRecords(
      recordsByType.get(RequestType.AD) || [], RequestType.AD, timeOffset);
    const headerBiddingRecords = constructRecords(
      recordsByType.get(RequestType.BID) || [], RequestType.BID, timeOffset);
    /** @type {Object<string, BidRequest>} */
    const bidRequests = {};

    let hasSerialHeaderBidding;
    const validHeaderBiddingRecords = [];
    if (headerBiddingRecords.length <= 1) {
      hasSerialHeaderBidding = false;
    } else {
      let previousHost = '';
      for (const record of headerBiddingRecords) {
        const startTime = record.startTime * 1000;
        const endTime = record.endTime * 1000;
        const duration = endTime - startTime;
        const url = new URL(record.url);
        const protocol = url.protocol;
        const host = url.host;
        const path = url.pathname;

        const isSerialRequest = !previousHost.length ||
          startTime >= bidRequests[previousHost].endTime;

        if (!bidRequests[host] && isSerialRequest) {
          bidRequests[host] = {
            bidder: getHeaderBidder(record.url),
            url: protocol + '//' + host + path,
            startTime,
            endTime,
            duration,
          };
          previousHost = host;
          validHeaderBiddingRecords.push(record);
        }
      }

      // This means that at least 2 requests to different hosts occurred
      // serially.
      hasSerialHeaderBidding = Object.keys(bidRequests).length > 1;
    }

    return {
      numericValue: Number(hasSerialHeaderBidding),
      score: hasSerialHeaderBidding ? 0 : 1,
      details: SerialHeaderBidding.makeTableDetails(
        HEADINGS, Object.values(bidRequests)),
      extendedInfo: {
        adsRecords,
        headerBiddingRecords:
          hasSerialHeaderBidding ? validHeaderBiddingRecords : [],
      },
    };
  }
}

module.exports = SerialHeaderBidding;
