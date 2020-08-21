# Reduce tag load time

## Overview

The time it takes for the ad tag library script to load. This is the interval
from page load to tag load.

## Recommendations

This metric is not indicative of a specific issue. It should be used to help
identify areas for improvement and track that improvement over time.

The goal here is to reduce the time it takes for the ad tag library script to
load. Ensuring that other, more specific audits are passing should have a major
impact on this metric. In particular, the following audits are likely to affect
this time:

* [Ad request waterfall](./ad-request-critical-path)
* [Avoid render-blocking resources](./ad-render-blocking-resources)
* [Load ad scripts statically](./script-injected-tags)
* [Load ad tag asynchronously](./async-ad-tags)
* [Load GPT from recommended host](./loads-gpt-from-sgdn)

## More information

The following ad tag library scripts are measured for tag load time:

| Library              | Script                                      |
|----------------------|---------------------------------------------|
| AMP DoubleClick      | `cdn.ampproject.org/v0/amp-ad-doubleclick-impl-<version>.js` |
| AdSense              | `pagead2.googlesyndication.com/pagead/js/<version>/show_ads_impl_<version>.js` |
| Google Publisher Tag | `securepubads.g.doubleclick.net/gpt/pubads_impl_<version>.js` |

[Avoiding Common GPT Implementation Mistakes](https://developers.google.com/doubleclick-gpt/common_implementation_mistakes)  
[Tagging best practices to minimize page latency](https://support.google.com/admanager/answer/7485975)
