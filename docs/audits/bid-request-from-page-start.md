# Reduce time to send the first bid request

## Overview

The time it takes for the first header bidding request to be made. This is the
interval from page load until the first header bidding request is issued.

## Recommendations

This metric is not indicative of a specific issue. It should be used to help
identify areas for improvement and track that improvement over time.

The goal here is to reduce the time it takes for the first header bidding
request to be made. Ensuring that other, more specific audits are passing should
have a major impact on this metric. In particular, the following audits are
likely to affect this time:

* [Ad request waterfall](./ad-request-critical-path.md)
* [Avoid long tasks that block ad-related network requests](./ad-blocking-tasks.md)
* [Load GPT and bids in parallel](./gpt-bids-parallel.md)

## More information

This metric identifies "first bid request" as the earliest recorded request to a
[supported ad exchange or supply side platform](https://github.com/googleads/publisher-ads-lighthouse-plugin/blob/master/lighthouse-plugin-publisher-ads/utils/bidder-patterns.js).
