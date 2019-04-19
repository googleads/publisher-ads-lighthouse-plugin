// Copyright 2019 Google LLC
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

const Messages = {
  AUDITS: {
    'ad-blocking-tasks': {
      title: 'No long tasks seem to block ad-related network requests',
      failureTitle: 'Long tasks are blocking ad-related network requests',
      description: 'Tasks blocking the main thread can delay the ad related ' +
          'resources, consider removing long blocking tasks or moving them ' +
          'off the main thread with web workers. These tasks can be ' +
          'especially detrimental to performance on less powerful devices. ' +
          '[Learn more.](https://ad-speed-insights.appspot.com/#long-tasks)',
    },
    'ad-request-critical-path': {
      title: 'No resources blocking first ad request',
      failureTitle: 'There are resources blocking the first ad request',
      description: 'These are the resources that block the first ad request. ' +
          'Consider reducing the number of resources or improving their ' +
          'execution to start loading ads as soon as possible. ' +
          '[Learn more.]' +
          '(https://ad-speed-insights.appspot.com/#blocking-resouces)',
    },
    'ad-request-from-page-start': {
      title: 'Latency of first ad request (from page start)',
      failureTitle: 'Reduce latency of first ad request (from page start)',
      description: 'This measures the time for the first ad request to be' +
          ' made relative to the page load starting. ' +
          '[Learn more.]' +
          '(https://ad-speed-insights.appspot.com/#measurements)',
    },
    'ad-request-from-tag-load': {
      title: 'Latency of first ad request (from tag load)',
      failureTitle: 'Reduce latency of first ad request (from tag load)',
      description: 'This measures the time for the first ad request to be' +
          ' made relative to the Google Publisher Tag loading. ' +
          '[Learn more.]' +
          '(https://ad-speed-insights.appspot.com/#measurements)',
    },
    'ad-top-of-viewport': {
      title: 'Ads are below top of viewport',
      failureTitle: 'Top ad is too high in viewport',
      description: 'Over 10% of ads are never viewed due to the user scrolling' +
        ' past before the ad is visible. By moving ads away from the very top' +
        ' of the viewport, the likelihood of the ad being scrolled past prior' +
        ' to load is decreased  and the ad is more likely to be viewed. ' +
        '[Learn more.]' +
        '(https://ad-speed-insights.appspot.com/#top-of-viewport)',
    },
    'ads-in-viewport': {
      title: 'Few or no ads loaded outside viewport',
      failureTitle: 'There are eager ads loaded outside viewport',
      description: 'Too many ads loaded outside the viewport lowers ' +
          'viewability rates and impact user experience, consider loading ' +
          'ads below the fold lazily as the user scrolls down. Consider ' +
          'using GPT\'s [Lazy Loading API]' +
          '(https://developers.google.com/doubleclick-gpt/reference' +
          '#googletag.PubAdsService_enableLazyLoad). [Learn more.]' +
          '(https://ad-speed-insights.appspot.com/#eager-ads)',
    },
    'async-ad-tags': {
      title: 'GPT tag is loaded asynchronously',
      failureTitle: 'GPT tag is loaded synchronously',
      description: 'Loading the GPT tag synchronously blocks all content ' +
          'rendering until the tag is fetched and evaluated, consider using ' +
          'the `async` attribute for the GPT tag to ensure it is loaded ' +
          'asynchronously. [Learn more.]' +
          '(https://ad-speed-insights.appspot.com/#async-tags)',
    },
    'duplicate-tags': {
      title: 'No duplicate tags are loaded in any frame',
      failureTitle: 'There are duplicate tags loaded in the same frame',
      description: 'Loading a tag more than once in the same frame is ' +
        'redundant and adds overhead without benefit. [Learn more.]' +
        '(https://ad-speed-insights.appspot.com/#duplicate-tags)',
    },
    'full-width-slots': {
      title: 'Slots are utilizing most of the viewport width',
      failureTitle: 'Slots are not utilizing the full viewport width',
      description: 'Have ad slot sizes that utilize most of the viewport\'s ' +
      'width to increase CTR. We recommend leaving no more than 25% of the ' +
      'viewport\'s width unutilized. [Learn more.]' +
      '(https://ad-speed-insights.appspot.com/#full-width-slots)',
    },
    'loads-gpt-over-https': {
      title: 'Uses HTTPS to load GPT',
      failureTitle: 'GPT tag is loaded insecurely',
      description: 'For privacy and security always load GPT over HTTPS. With' +
        ' insecure pages explicitly request the GPT script securely. Example:' +
        '`<script async="async" ' +
        'src="https://www.googletagservices.com/tag/js/gpt.js">`. ' +
        '[Learn more.]' +
        '(https://ad-speed-insights.appspot.com/#https)',
    },
    'serial-header-bidding': {
      title: 'No serial header bidding detected',
      failureTitle: 'There are serial header bidding requests',
      description: 'Running header bidding serially make ads load slower, ' +
          'which has an impact on impressions. Consider running in parallel. ' +
          '[Learn more.]' +
          '(https://ad-speed-insights.appspot.com/#serial-header-bidding)',
    },
    'static-ad-tags': {
      title: 'GPT tag is loaded statically',
      failureTitle: 'GPT tag is loaded dynamically',
      description: 'Tags loaded dynamically are not visible to the browser ' +
      'preloader, consider using a static tag or `<link rel="preload">`. ' +
      '[Learn more.]' +
      '(https://ad-speed-insights.appspot.com/#dynamic-tag)',
    },
    'tag-load-time': {
      title: 'Tag load time',
      failureTitle: 'Reduce tag load time',
      description: 'This measures the time for the Google Publisher' +
          ' Tag\'s implementation script (pubads_impl.js) to load after the ' +
          'page loads. [Learn more.]' +
          '(https://ad-speed-insights.appspot.com/#measurements)',
    },
    'viewport-ad-density': {
      title: 'Ad density inside viewport is within recommended range',
      failureTitle: 'Ad density inside viewport is higher than recommended',
      description: 'The ads-to-content ratio inside the viewport can have ' +
          'an impact on user experience and ultimately user retention. The ' +
          'Better Ads Standard [recommends having an ad density below 30%]' +
          '(https://www.betterads.org/mobile-ad-density-higher-than-30/). ' +
          '[Learn more.]' +
          '(https://ad-speed-insights.appspot.com/#ad-density)',
    },
  },
  NOT_APPLICABLE: {
    DEFAULT: 'Audit not applicable',
    INVALID_TIMING: 'Invalid timing task data',
    NO_AD_RELATED_REQ: 'No ad-related requests',
    NO_ADS_VP: 'No ads in viewport',
    NO_ADS: 'No ads requested',
    NO_BIDS: 'No bids detected',
    NO_EVENT_MATCHING_REQ: 'No event matches network records',
    NO_GPT: 'GPT not requested',
    NO_RECORDS: 'No successful network records',
    NO_SLOTS: 'No visible slots',
    NO_TAG: 'No tag requested',
    NO_TAGS: 'No tags requested',
    NO_TASKS: 'No tasks to compare',
    NO_VALID_AD_WIDTHS: 'No requested ads contain ads of valid width',
  },
  ERRORS: {
    AREA_LARGER_THAN_VP: 'Calculated ad area is larger than viewport',
    VP_AREA_ZERO: 'Viewport area is zero',
  },
};

module.exports = Messages;
