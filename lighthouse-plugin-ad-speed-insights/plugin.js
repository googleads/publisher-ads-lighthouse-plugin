/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/** @type {LH.Config.Plugin} */
module.exports = {
  audits: [
    {path: './audits/ad-blocking-tasks'},
    {path: './audits/ad-request-critical-path'},
    {path: './audits/ads-in-viewport'},
    {path: './audits/async-ad-tags'},
    {path: './audits/loads-gpt-over-https'},
    {path: './audits/static-ad-tags'},
    {path: './audits/viewport-ad-density'},
    {path: './audits/tag-load-time'},
    {path: './audits/ad-request-from-page-start'},
    {path: './audits/ad-request-from-tag-load'},
    {path: './audits/full-width-slots'},
    {path: './audits/ad-top-of-viewport'},
    {path: './audits/duplicate-tags'},
    {path: './audits/serial-header-bidding'},
  ],
    groups: {
    'measurements': {
      title: 'Measurements',
    },
    'ads-performance': {
      title: 'Performance',
    },
    'ads-best-practices': {
      title: 'Best Practices',
    },
  },
  category: {
    title: 'Ad Quality [Alpha]',
    auditRefs: [
        // Measurements group.
        {id: 'tag-load-time', weight: 1, group: 'measurements'},
        {id: 'ad-request-from-tag-load', weight: 1, group: 'measurements'},
        {id: 'ad-request-from-page-start', weight: 1, group: 'measurements'},
        // Performance group.
        {id: 'ad-blocking-tasks', weight: 1, group: 'ads-performance'},
        {id: 'ad-request-critical-path', weight: 1, group: 'ads-performance'},
        {id: 'serial-header-bidding', weight: 1, group: 'ads-performance'},
        // Best Practices group.
        {id: 'ads-in-viewport', weight: 1, group: 'ads-best-practices'},
        {id: 'async-ad-tags', weight: 1, group: 'ads-best-practices'},
        {id: 'loads-gpt-over-https', weight: 1, group: 'ads-best-practices'},
        {id: 'static-ad-tags', weight: 1, group: 'ads-best-practices'},
        {id: 'viewport-ad-density', weight: 1, group: 'ads-best-practices'},
        {id: 'full-width-slots', weight: 1, group: 'ads-best-practices'},
        {id: 'ad-top-of-viewport', weight: 1, group: 'ads-best-practices'},
        {id: 'duplicate-tags', weight: 1, group: 'ads-best-practices'},
    ],
  },
};
