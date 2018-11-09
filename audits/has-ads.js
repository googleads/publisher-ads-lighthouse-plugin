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

const {Audit} = require('lighthouse');
const {isGoogleAds, hasAdRequestPath, hasImpressionPath} = require('../utils/resource-classification');
const {URL} = require('url');

/**
 * Simple audit that checks for the presence of ads. Currently based on network
 * logs since it's simple for testing.
 */
class HasAds extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id: 'has-ads',
      title: 'Page has ad requests',
      failureTitle: 'No ad requests were detected',
      description: 'Let us know if we miss something. [Feedback](#TODO)',
      requiredArtifacts: ['devtoolsLogs'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts) {
    const devtoolsLogs = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const networkRecords = await artifacts.requestNetworkRecords(devtoolsLogs);
    const parsedUrls = networkRecords
        .map((record) => new URL(record.url));
    const googleAdsEntries = parsedUrls.filter(isGoogleAds);

    let numRequests = 0;
    let numImpressions = 0;

    for (const url of googleAdsEntries) {
      if (hasAdRequestPath(url)) {
        numRequests++;
      } else if (hasImpressionPath(url)) {
        numImpressions++;
      }
    }

    return {
      rawValue: numRequests,
      score: numRequests > 0 ? 1 : 0,
      details: {numRequests, numImpressions},
    };
  }
}

module.exports = HasAds;
