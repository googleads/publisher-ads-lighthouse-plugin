# Reduce latency of first ad request

## Overview

The time it takes for the first ad request to be made. This is the interval from
page load until the first ad request is issued.

## Recommendations

This metric is not indicative of a specific issue. It should be used to help
identify areas for improvement and track that improvement over time.

The goal here is to reduce the time it takes for the first ad request to be
made. Ensuring that other, more specific audits are passing should have a major
impact on this metric. In particular, audits affecting
[tag load time](./tag-load-time.md) and
[latency of first ad request (from tag load)](./ad-request-from-tag-load.md) are
likely to affect this metric.

## More information

This metric identifies "first ad request" as the earliest recorded request to
one of:

| Library              | Host                             | Path          |
|----------------------|----------------------------------|---------------|
| AdSense              | `googleads.g.doubleclick.net`    | `/pagead/ads` |
| Google Publisher Tag | `securepubads.g.doubleclick.net` | `/gampad/ads` |

[Avoiding Common GPT Implementation Mistakes](https://developers.google.com/publisher-tag/common_implementation_mistakes)
[Tagging best practices to minimize page latency](https://support.google.com/admanager/answer/7485975)
