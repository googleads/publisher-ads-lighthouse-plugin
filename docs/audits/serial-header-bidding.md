# Parallelize bid requests

## Overview

This audit checks whether or not header bidding requests are being made
sequentially. In most cases, these requests are not dependent on one another and
can be made in parallel to speed up ad loading.

## Recommendations

Issue header bidding requests in parallel, rather than sequentially. This means
that you should send all bid requests at the same time instead of issuing one
request at time. If you're using a header bidding library, the library
documentation may have recommendations on how to do this.

## More information

The list of supported ad exchanges and supply side platforms this audit
evaluates can be found in
[our GitHub repository](https://github.com/googleads/publisher-ads-lighthouse-plugin/blob/HEAD/lighthouse-plugin-publisher-ads/utils/bidder-patterns.js).

[How to reduce the latency of header bidding with Prebid.js](https://dev.prebid.org/overview/how-to-reduce-latency-of-header-bidding.html)
