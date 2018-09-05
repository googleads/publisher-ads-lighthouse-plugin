const {hasAdRequestPath, isImplTag} = require('./resource-classification');
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
    (record) => hasAdRequestPath(new URL(record.url)));
  return firstAdRecord ? firstAdRecord.startTime : -1;
}

/**
 * Returns start time of page load (s) relative to system boot.
 * @param {LH.Artifacts.NetworkRequest[]} networkRecords
 * @param {number=} defaultValue
 * @return {number}
 */
function getPageStartTime(networkRecords, defaultValue = -1) {
  const fistSuccessRecord = networkRecords.find(
    (record) => record.statusCode == 200);
  return fistSuccessRecord ? fistSuccessRecord.startTime : defaultValue;
}

module.exports = {
  getTagEndTime,
  getAdStartTime,
  getPageStartTime,
};
