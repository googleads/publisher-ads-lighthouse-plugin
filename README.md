# AdSpeed Page Scanning Insights

Ad-aware extension for [lighthouse](https://github.com/GoogleChrome/lighthouse).

## How to Run

Generate a ad-aware lighthouse report by running:

```shell
$ node index.js https://www.example.com
```

Available options:
-   Any of [lighthouse flags](https://github.com/GoogleChrome/lighthouse/#cli-options)
-   `--debug`: Will print additional debugging information when running.
-   `--visuals-path`: Produces an HTML file with dynamically generated visuals.

## References

-   Lighthouse Docs: https://github.com/GoogleChrome/lighthouse
-   DevTools Protocol: https://chromedevtools.github.io/devtools-protocol
-   HAR Spec: https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/HAR/Overview.html
