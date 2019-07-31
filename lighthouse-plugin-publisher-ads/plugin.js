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

const {group} = require('./messages/common-strings');

const PLUGIN_PATH = 'lighthouse-plugin-publisher-ads';

/** @type {LH.Config.Plugin} */
module.exports = {
  audits: [
    {path: `${PLUGIN_PATH}/audits/ad-blocking-tasks`},
    {path: `${PLUGIN_PATH}/audits/ad-render-blocking-resources`},
    {path: `${PLUGIN_PATH}/audits/ad-request-critical-path`},
    {path: `${PLUGIN_PATH}/audits/bottleneck-requests`},
    {path: `${PLUGIN_PATH}/audits/idle-network-times`},
    {path: `${PLUGIN_PATH}/audits/blocking-load-events`},
    {path: `${PLUGIN_PATH}/audits/ads-in-viewport`},
    {path: `${PLUGIN_PATH}/audits/async-ad-tags`},
    {path: `${PLUGIN_PATH}/audits/loads-gpt-over-https`},
    {path: `${PLUGIN_PATH}/audits/loads-gpt-from-sgdn`},
    {path: `${PLUGIN_PATH}/audits/static-ad-tags`},
    {path: `${PLUGIN_PATH}/audits/viewport-ad-density`},
    {path: `${PLUGIN_PATH}/audits/tag-load-time`},
    {path: `${PLUGIN_PATH}/audits/gpt-bids-parallel`},
    {path: `${PLUGIN_PATH}/audits/ad-request-from-page-start`},
    {path: `${PLUGIN_PATH}/audits/ad-request-from-tag-load`},
    {path: `${PLUGIN_PATH}/audits/first-ad-paint`},
    {path: `${PLUGIN_PATH}/audits/full-width-slots`},
    {path: `${PLUGIN_PATH}/audits/ad-top-of-viewport`},
    {path: `${PLUGIN_PATH}/audits/duplicate-tags`},
    {path: `${PLUGIN_PATH}/audits/serial-header-bidding`},
    {path: `${PLUGIN_PATH}/audits/script-injected-tags`},
  ],
  groups: {
    'metrics': {
      title: group.Metrics,
    },
    'ads-performance': {
      title: group.AdsPerformance,
    },
    'ads-best-practices': {
      title: group.AdsBestPractices,
    },
  },
  category: {
    title: 'Publisher Ads [Beta]',
    auditRefs: [
      // Measurements group.
      {id: 'tag-load-time', weight: 4, group: 'metrics'},
      {id: 'ad-request-from-tag-load', weight: 4, group: 'metrics'},
      {id: 'ad-request-from-page-start', weight: 4, group: 'metrics'},
      {id: 'first-ad-paint', weight: 8, group: 'metrics'},
      // Performance group.
      {id: 'bottleneck-requests', weight: 1, group: 'ads-performance'},
      {id: 'gpt-bids-parallel', weight: 1, group: 'ads-performance'},
      {id: 'serial-header-bidding', weight: 1, group: 'ads-performance'},
      {id: 'ad-render-blocking-resources', weight: 1, group: 'ads-performance'},
      {id: 'script-injected-tags', weight: 1, group: 'ads-performance'},
      {id: 'static-ad-tags', weight: 1, group: 'ads-performance'},
      {id: 'blocking-load-events', weight: 1, group: 'ads-performance'},
      {id: 'ad-blocking-tasks', weight: 1, group: 'ads-performance'},
      {id: 'ad-request-critical-path', weight: 1, group: 'ads-performance'},
      // Best Practices group.
      {id: 'ads-in-viewport', weight: 4, group: 'ads-best-practices'},
      {id: 'async-ad-tags', weight: 2, group: 'ads-best-practices'},
      {id: 'loads-gpt-over-https', weight: 1, group: 'ads-best-practices'},
      {id: 'loads-gpt-from-sgdn', weight: 1, group: 'ads-best-practices'},
      {id: 'viewport-ad-density', weight: 1, group: 'ads-best-practices'},
      {id: 'ad-top-of-viewport', weight: 2, group: 'ads-best-practices'},
      {id: 'duplicate-tags', weight: 1, group: 'ads-best-practices'},
    ],
  },
};
