# Reduce ad layout shift

## Overview

Measures the total amount of user-visible layout shift that were caused by or
happened near ads.


## Recommendations

This metric is not indicative of a specific issue. It should be used to help
identify areas for improvement and track that improvement over time.

To avoid layout shift, it's important to set sizes for ad elements before the
ad tag loads. Ads are usually dynamically sized which can make it difficult or
impossible to reserve the exact size of the ad ahead of time, but it's possible
to reserve extra space to handle multi-size slots. More information about
minimizing ad layout shift [can be found at the GPT reference]
(https://developers.google.com/doubleclick-gpt/guides/minimize-layout-shift).

## More information

[Cumulative Layout Shift(CLS)](https://web.dev/cls/)
[Optimize Cumulative Layout Shift](https://web.dev/optimize-cls/)
