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

* [Ad request waterfall](./ad-request-critical-path)
* [Avoid bottleneck requests](./bottleneck-requests)
* [Avoid long tasks that block ad-related network requests](./ad-blocking-tasks)
* [Avoid waiting on load events](./blocking-load-events)
* [Load GPT and bids in parallel](./gpt-bids-parallel)
* [Parallelize bid requests](./serial-header-bidding)

## More information

This metric identifies "first ad request" as the earliest recorded request to
one of:

| Library              | Host                             | Path          |
|----------------------|----------------------------------|---------------|
| AMP Doubleclick      | `securepubads.g.doubleclick.net` | `/gampad/ads` |
| AdSense              | `googleads.g.doubleclick.net`    | `/pagead/ads` |
| Google Publisher Tag | `securepubads.g.doubleclick.net` | `/gampad/ads` |

and identifies "tag load" as the earliest execution of:

| Library              | Script                                      |
|----------------------|---------------------------------------------|
| AMP Doubleclick      | `cdn.ampproject.org/v0/amp-ad-doubleclick-impl-<version>.js` |
| AdSense              | `pagead2.googlesyndication.com/pagead/js/<version>/show_ads_impl_<version>.js` |
| Google Publisher Tag | `securepubads.g.doubleclick.net/gpt/pubads_impl_<version>.js` |

[Avoiding Common GPT Implementation Mistakes](https://developers.google.com/doubleclick-gpt/common_implementation_mistakes)  
[Tagging best practices to minimize page latency](https://support.google.com/admanager/answer/7485975)
