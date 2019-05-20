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

const {isGptAdRequest, isImplTag} = require('./resource-classification');
const {URL} = require('url');

/**
 * Returns end time of tag load (s) relative to system boot.
 * @param {LH.Artifacts.NetworkRequest[]} networkRecords
 * @return {number}
 */
function getTagEndTime(networkRecords) {
  const tagRecord = networkRecords.find(
    (record) => isImplTag(new URL(record.url)));
  return tagRecord ? tagRecord.endTime : -1;
}

/**
 * Returns start time of first ad request (s) relative to system boot.
 * @param {LH.Artifacts.NetworkRequest[]} networkRecords
 * @return {number}
 */
function getAdStartTime(networkRecords) {
  const firstAdRecord = networkRecords.find(
    (record) => isGptAdRequest(record));
  return firstAdRecord ? firstAdRecord.startTime : -1;
}

/**
 * Returns start time of page request (s) relative to system boot.
 * @param {LH.Artifacts.NetworkRequest[]} networkRecords
 * @param {number=} defaultValue
 * @return {number}
 */
function getPageStartTime(networkRecords, defaultValue = -1) {
  const firstSuccessRecord = networkRecords.find(
    (record) => record.statusCode == 200);
  return firstSuccessRecord ? firstSuccessRecord.startTime : defaultValue;
}

/**
 * Returns start time of page response (s) relative to system boot.
 * @param {LH.Artifacts.NetworkRequest[]} networkRecords
 * @param {number=} defaultValue
 * @return {number}
 */
function getPageResponseTime(networkRecords, defaultValue = -1) {
  const firstSuccessRecord = networkRecords.find(
    (record) => record.statusCode == 200);
  return firstSuccessRecord ?
    firstSuccessRecord.responseReceivedTime : defaultValue;
}

module.exports = {
  getTagEndTime,
  getAdStartTime,
  getPageStartTime,
  getPageResponseTime,
};
