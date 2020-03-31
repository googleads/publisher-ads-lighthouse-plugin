# Avoid render-blocking resources

## Overview

This audit identifies resources (specifically scripts and stylesheets) which are
delaying the loading of ad tag libraries. These are resources that were
requested and received before ad tag libraries began loading. Reducing the
number of resources requested prior to tag load will speed up ad loading.

## Recommendations

The details of this audit contain a list of all scripts and stylesheets that are
delaying tag load. The goal is to reduce the number of entries in this list as
close to 0 as possible. Some tips for doing this include:

* Loading ad tag libraries earlier in the `<head>` of the page.
* Inlining scripts and stylesheets critical to core functionality directly into
  your HTML.
* Marking non-critical scripts with the `async` or `defer` attributes.
* Separating styles into different files by media query and using the `media`
  attribute to load them only when needed.

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

[Rendering Blocking Resources](https://developers.google.com/web/tools/lighthouse/audits/blocking-resources)
