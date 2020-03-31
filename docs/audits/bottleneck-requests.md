# Avoid bottleneck requests

## Overview

This audit identifies long-running requests that are blocking the first ad
request. These are requests that were initiated and which also received a
response before the first ad request was made. Reducing the number and duration
of these blocking requests will reduce the latency of the first ad request,
speeding up ad loading.

## Recommendations

The details of this audit contain the top 5 blocking requests
([by cost](#more_information)). The goal here is to remove or reduce the
duration of these requests to speed up ad loading. Some tips for doing this
include:

* Eliminating unnecessary requests.
* Deferring non-critical requests until after ads are loaded.
* Issuing requests in parallel rather than serially.
* Improving response times by optimizing backend services, using HTTP/2, etc.

## More information {: #more_information}

This audit displays the top 5 bottleneck requests by cost. The cost of a request
is computed as follows:

`request duration + (request self-time * 3)`

Where request self-time is equal to duration minus time spent blocked by other
requests. Only requests with a self-time greater than 250ms or a duration
greater than 1s are considered.
