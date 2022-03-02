# Load GPT and bids in parallel

## Overview

This audit checks whether or not header bidding requests are deferred until the
Google Publisher Tag (GPT) library loads. In most cases, these requests are not
dependent on GPT and can be made in parallel with the library being loaded to
speed up ad loading.

## Recommendations

Ensure that header bidding requests do not wait on `googletag.pubadsReady()` or
`googletag.cmd.push()`.

### Prebid.js Example

<table class="details responsive">
  <tr>
    <td><strong>Incorrect</strong></td>
    <td>
<pre class="prettyprint lang-js">window.pbjs = pbjs || {};
pbjs.que = pbjs.que || [];

window.googletag = window.googletag || {};
googletag.cmd = googletag.cmd || [];
<strong>googletag.cmd.push(function() {
  googletag.pubads().disableInitialLoad();
  // Incorrect: Making bid requests dependent on GPT loading.
  pbjs.que.push(function() {
    pbjs.requestBids({
     bidsBackHandler: handleBidResponse
    });
  });
});</strong></pre>
    </td>
  </tr>
  <tr>
    <td><strong>Correct</strong></td>
    <td>
<pre class="prettyprint lang-js"><strong>window.pbjs = pbjs || {};
pbjs.que = pbjs.que || [];
// Correct: Making bid requests independent of GPT loading.
pbjs.que.push(function() {
  pbjs.requestBids({
    bidsBackHandler: handleBidResponse
  });
});</strong>

window.googletag = window.googletag || {};
googletag.cmd = googletag.cmd || [];
googletag.cmd.push(function() {
  googletag.pubads().disableInitialLoad();
});</pre>
    </td>
  </tr>
</table>


## More information

The list of supported ad exchanges and supply side platforms this audit
evaluates can be found in
[our GitHub repository](https://github.com/googleads/publisher-ads-lighthouse-plugin/blob/HEAD/lighthouse-plugin-publisher-ads/utils/bidder-patterns.js).
