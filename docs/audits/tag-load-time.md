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

* [Ad request waterfall](./ad-request-critical-path.md)
* [Avoid render-blocking resources](./ad-render-blocking-resources.md)
* [Load ad scripts statically](./script-injected-tags.md)
* [Load ad tag asynchronously](./async-ad-tags.md)
* [Load GPT from recommended host](./loads-gpt-from-sgdn.md)

## More information

The following ad tag library scripts are supported:

<table>
  <tr>
    <th>Library</th>
    <th>Script(s)</th>
  </tr>
  <tr>
    <td>AdSense</td>
    <td>
      <p><code>pagead2.googlesyndication.com/pagead/js/adsbygoogle.js</code></p>
      <p><code>pagead2.googlesyndication.com/pagead/show_ads.js</code></p>
    </td>
  </tr>
  <tr>
    <td>Google Publisher Tag</td>
    <td><code>.../gpt/pubads_impl_&lt;version&gt;.js</code></td>
  </tr>
</table>

[Avoiding Common GPT Implementation Mistakes](https://developers.google.com/publisher-tag/common_implementation_mistakes)
[Tagging best practices to minimize page latency](https://support.google.com/admanager/answer/7485975)
