# Load ad tag asynchronously

## Overview

This audit ensures ad tag library scripts are loaded asynchronously. Requesting
scripts synchronously leads to content being blocked until those scripts are
loaded.

## Recommendations

Include the async attribute in the script tag definition. For example:

```HTML
<script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script>
```

## More information

The following ad tag library scripts are supported:

<table>
  <tr>
    <th>Ad Tag Library</th>
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

[Get Started with Google Publisher Tags](https://support.google.com/admanager/answer/1638622)  
[GPT request modes and asynchronous rendering](https://support.google.com/admanager/answer/183282)

