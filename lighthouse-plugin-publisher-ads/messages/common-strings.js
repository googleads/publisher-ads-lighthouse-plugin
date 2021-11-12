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

const UIStrings = {
  GROUPS__METRICS: 'Metrics',
  GROUPS__ADS_PERFORMANCE: 'Ad Speed',
  GROUPS__ADS_BEST_PRACTICES: 'Tag Best Practices',

  NOT_APPLICABLE__DEFAULT: 'Audit not applicable',
  NOT_APPLICABLE__INVALID_TIMING: 'Invalid timing task data',
  NOT_APPLICABLE__NO_AD_RELATED_REQ: 'No ad-related requests',
  NOT_APPLICABLE__NO_AD_RENDERED: 'No ads rendered',
  NOT_APPLICABLE__NO_ADS_VIEWPORT: 'No ads in viewport',
  NOT_APPLICABLE__NO_ADS: 'No ads requested',
  NOT_APPLICABLE__NO_BIDS: 'No bids detected',
  NOT_APPLICABLE__NO_EVENT_MATCHING_REQ: 'No event matches network records',
  NOT_APPLICABLE__NO_GPT: 'GPT not requested',
  NOT_APPLICABLE__NO_RECORDS: 'No successful network records',
  NOT_APPLICABLE__NO_VISIBLE_SLOTS: 'No visible slots',
  NOT_APPLICABLE__NO_TAG: 'No tag requested',
  NOT_APPLICABLE__NO_TAGS: 'No tags requested',
  NOT_APPLICABLE__NO_TASKS: 'No tasks to compare',
  NOT_APPLICABLE__NO_VALID_AD_WIDTHS: 'No requested ads contain ads of valid width',
  NOT_APPLICABLE__NO_LAYOUT_SHIFTS: 'No layout shift events found',

  ERRORS__AREA_LARGER_THAN_VIEWPORT: 'Calculated ad area is larger than viewport',
  ERRORS__VIEWPORT_AREA_ZERO: 'Viewport area is zero',

  WARNINGS__NO_ADS: 'No ads were requested when fetching this page.',
  WARNINGS__NO_AD_RENDERED: 'No ads were rendered when rendering this page.',
  WARNINGS__NO_TAG: 'The GPT tag was not requested.',
};
const i18n = require('lighthouse/lighthouse-core/lib/i18n/i18n.js');

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

/**
 * Returns object for a notApplicable audit given a message string
 * @param {string} message
 * @return {LH.Audit.Product}
 */
const notApplicableObj = (message) => ({
  notApplicable: true,
  score: 1,
  displayValue: str_(message),
});

/**
 * Returns notApplicable object for a given property.
 * @return {LH.Audit.Product}
 */
const auditNotApplicable = {
  Default: notApplicableObj(UIStrings.NOT_APPLICABLE__DEFAULT),
  InvalidTiming: notApplicableObj(UIStrings.NOT_APPLICABLE__INVALID_TIMING),
  NoAdRelatedReq: notApplicableObj(UIStrings.NOT_APPLICABLE__NO_AD_RELATED_REQ),
  NoAdRendered: notApplicableObj(UIStrings.NOT_APPLICABLE__NO_AD_RENDERED),
  NoAdsViewport: notApplicableObj(UIStrings.NOT_APPLICABLE__NO_ADS_VIEWPORT),
  NoAds: notApplicableObj(UIStrings.NOT_APPLICABLE__NO_ADS),
  NoBids: notApplicableObj(UIStrings.NOT_APPLICABLE__NO_BIDS),
  NoEventMatchingReq: notApplicableObj(
    UIStrings.NOT_APPLICABLE__NO_EVENT_MATCHING_REQ),
  NoGpt: notApplicableObj(UIStrings.NOT_APPLICABLE__NO_GPT),
  NoLayoutShifts: notApplicableObj(UIStrings.NOT_APPLICABLE__NO_LAYOUT_SHIFTS),
  NoRecords: notApplicableObj(UIStrings.NOT_APPLICABLE__NO_RECORDS),
  NoVisibleSlots: notApplicableObj(UIStrings.NOT_APPLICABLE__NO_VISIBLE_SLOTS),
  NoTag: notApplicableObj(UIStrings.NOT_APPLICABLE__NO_TAG),
  NoTags: notApplicableObj(UIStrings.NOT_APPLICABLE__NO_TAGS),
  NoTasks: notApplicableObj(UIStrings.NOT_APPLICABLE__NO_TASKS),
  NoValidAdWidths: notApplicableObj(
    UIStrings.NOT_APPLICABLE__NO_VALID_AD_WIDTHS),
};

const runWarning = {
  NoAds: str_(UIStrings.WARNINGS__NO_ADS),
  NoAdRendered: str_(UIStrings.WARNINGS__NO_AD_RENDERED),
  NoTag: str_(UIStrings.WARNINGS__NO_TAG),
};

const auditError = {
  ViewportAreaZero: str_(UIStrings.ERRORS__VIEWPORT_AREA_ZERO),
};

const group = {
  Metrics: str_(UIStrings.GROUPS__METRICS),
  AdsPerformance: str_(UIStrings.GROUPS__ADS_PERFORMANCE),
  AdsBestPractices: str_(UIStrings.GROUPS__ADS_BEST_PRACTICES),
};

module.exports = {auditNotApplicable, runWarning, auditError, group};
module.exports.UIStrings = UIStrings;
