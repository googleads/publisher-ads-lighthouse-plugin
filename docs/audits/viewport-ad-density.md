# Reduce ads to page-height ratio

## Overview

This audit ensures that ads take up no more than 30% of the page vertically. A
ratio greater than 30% has been found to
[negatively impact user experience](https://www.betterads.org/research/standardpaper/).

## Recommendations

Depending on the situation, slots should either be spaced farther apart or have
a reduced size.

## More information

On mobile devices, we assume a single column layout and so all ads on the page
are included in the ratio calculation. On desktop, we divide the page into
multiple vertical slices to account for multi-column layouts. The audit measures
the ratio of ads to page-height in each slice individually to ensure no
individual slice exceeds the maximum recommended threshold.

To account for lazy loading, we measure content length up to 1 viewport past the
last ad. To measure the ratio over the entire content, disable lazy loading.

[Ad Experience: Ad Density Higher Than 30%](https://www.betterads.org/mobile-ad-density-higher-than-30/)  
[What publishers need to know now about creating a better ad experience](https://www.thinkwithgoogle.com/marketing-resources/better-ad-standards/)
