# Reduce Ad JS Blocking Time

## Overview

This audit measures the amount of [blocking time](https://web.dev/tbt/)
attributable to ad-related scripts. This captures time where the JS thread is
blocked by an ad-related script for long enough to be noticeable by users as it
can directly affect input delay or content loading.

## Recommendations

The most important factor in ad JS blocking time is how many ads are being
loaded. Our recommendations are:

- [Load fewer ads at once or reduce ad density](https://developers.google.com/publisher-ads-audits/reference/audits/viewport-ad-density), if feasible
- [Lazy load ads below the fold](https://developers.google.com/publisher-ads-audits/reference/audits/ads-in-viewport)
- [Reduce batch sizes if using Single Request Architecture (SRA) in GPT](https://developers.google.com/publisher-tag/guides/publisher-console-messages#TOO_MANY_SLOTS_IN_SRA_REQUEST).

## More information

The metric sums the _blocking time_ of each JS task coming from an ad-related
script. See [web.dev](https://web.dev/lighthouse-total-blocking-time/#what-tbt-measures)
for more information about this is defined.

A script is considered to be ad-related if it is either an ad tag or labeled as
an "ad" script by https://github.com/patrickhulce/third-party-web.
