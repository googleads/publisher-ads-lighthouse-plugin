# Lazily load ads below the fold

## Overview

Key Term: "below the fold" refers to the area of the page outside of the initial
viewport.

This audit checks that no more than three ads are initially loaded below the
fold. The area below the fold only becomes visible after a user scrolls down.
Ads in this area are less likely to be seen by users, so loading an excessive
number of them can lower
[viewability rates](https://support.google.com/admanager/answer/4524488) and
decrease page performance.

## Recommendations

Lazily load ads that are positioned below the fold. Lazy loading is a technique
that prevents ads outside of the viewport from being requested and rendered
until they are close to being scrolled into view. See the
[GPT lazy loading sample](https://developers.google.com/publisher-tag/samples/lazy-loading)
for an example implementation.

## More information

[GPT lazy loading API](https://developers.google.com/publisher-tag/reference#googletag.PubAdsService_enableLazyLoad)  
[Viewability best practices](https://support.google.com/admanager/answer/6199883)
