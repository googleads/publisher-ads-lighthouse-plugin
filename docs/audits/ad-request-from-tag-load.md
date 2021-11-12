# Reduce latency of first ad request (from tag load)

## Overview

The time it takes for the first ad request to be made. This is the interval from
tag load until the first ad request is issued.

## Recommendations

This metric is not indicative of a specific issue. It should be used to help
identify areas for improvement and track that improvement over time.

The goal here is to reduce the time it takes for the first ad request to be
made. Ensuring that other, more specific audits are passing should have a major
impact on this metric. In particular, the following audits are likely to affect
this time:

* [Ad request waterfall](./ad-request-critical-path.md)
* [Avoid bottleneck requests](./bottleneck-requests.md)
* [Avoid long tasks that block ad-related network requests](./ad-blocking-tasks.md)
* [Avoid waiting on load events](./blocking-load-events.md)
* [Load GPT and bids in parallel](./gpt-bids-parallel.md)
* [Parallelize bid requests](./serial-header-bidding.md)

## More information

This metric identifies "first ad request" as the earliest recorded request to
one of:

| Library              | Host                             | Path          |
|----------------------|----------------------------------|---------------|
| AdSense              | `googleads.g.doubleclick.net`    | `/pagead/ads` |
| Google Publisher Tag | `securepubads.g.doubleclick.net` | `/gampad/ads` |

[Avoiding Common GPT Implementation Mistakes](https://developers.google.com/publisher-tag/common_implementation_mistakes)
[Tagging best practices to minimize page latency](https://support.google.com/admanager/answer/7485975)
