# Reduce ad-related layout shift

## Overview

Cumulative Ad Shift measures the total amount of user-visible layout shift using
the [Layout Instability API](https://wicg.github.io/layout-instability/) by
summing the [layout shift score](https://web.dev/cls/#layout-shift-score) for
all layout shifts where the ad iframe shifted or caused the layout shift.

## Recommendations

This metric is not indicative of a specific issue. It should be used to help
identify areas for improvement and track that improvement over time.

To avoid layout shift, it's important to set sizes for ad elements before the
ad tag loads. This can be difficult or impossible to do perfectly—especially for
ad slots that accept dynamically sized ads—but there are best practices you can
follow to minimize layout shift in most cases. For more information, see the
[guide to minimizing layout shift](https://developers.google.com/doubleclick-gpt/guides/minimize-layout-shift)
at the GPT developer site.

## More information

[Cumulative Layout Shift (CLS)](https://web.dev/cls/)  
[Optimize Cumulative Layout Shift](https://web.dev/optimize-cls/)
