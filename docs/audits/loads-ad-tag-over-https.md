# Load ad tag over HTTPS

## Overview

Ensures that ad tag library scripts are being requested securely. This not only
provides better security for your users, it also improves performance. Since ad
requests issued by GPT always use HTTPS, loading the library itself from the
[recommended host](./loads-gpt-from-sgdn.md) via HTTPS ensures that the browser
only needs to open 1 connection for all requests related to ad serving.


Note: This should only fail on non-secure websites, as most secure websites will
automatically load scripts using HTTPS.

## Recommendations

Always load your ad tag scripts from an HTTPS URL.

<table class="details responsive">
  <tr>
    <td><strong>Incorrect</strong></td>
    <td>
<pre class="prettyprint lang-html">&lt;script&gt;
  var el = document.createElement('script');
  <strong>// Incorrect: potentially loading the ad tag over HTTP.
  var useSSL = 'https:' == document.location.protocol;
  el.src = (useSSL ? 'https:' : 'http:') + '//securepubads.g.doubleclick.net/tag/js/gpt.js';</strong>
  var node = document.getElementsByTagName('script')[0];
  node.parentNode.insertBefore(el, node);
&lt;/script&gt;</pre>
    </td>
  </tr>
  <tr>
    <td><strong>Correct</strong></td>
    <td>
<pre class="prettyprint lang-html">&lt;script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"&gt;&lt;/script&gt;</pre>
    </td>
  </tr>
</table>

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
    <td>
      <p><code>googletagservices.com/tag/js/gpt.js</code></p>
      <p><code>securepubads.g.doubleclick.net/tag/js/gpt.js</code></p>
    </td>
  </tr>
</table>

[Get Started with Google Publisher Tags](https://developers.google.com/publisher-tag/guides/get-started)
