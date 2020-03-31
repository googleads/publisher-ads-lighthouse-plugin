# Ad request waterfall

## Overview

A report of the resources requested before the first ad request is made. These
resources delay the first ad request, so minimizing their number will speed up
ad loading.

## Recommendations

This audit is purely informative and not something a page can pass or fail. Use
the information provided to reduce the time to first ad request by:

* Reducing the number of resources by removing them, deferring them, marking
  them async, etc.
* Combining resources to reduce the number of requests.
* Optimizing the order in which resources are loaded by requesting only critical
  resources prior to requesting ads.

Any of the above optimizations will have a positive impact on ad speed.

## More information

[Critical Request Chains](https://developers.google.com/web/tools/lighthouse/audits/critical-request-chains)  
[Tagging best practices to minimize page latency](https://support.google.com/admanager/answer/7485975)
