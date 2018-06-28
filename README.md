# AdSpeed Page Scanning Insights

## How to Run

For now, the tool is simply a CLI that prints some data to the console.

```shell
$ node index.js --url https://www.example.com
```

Other options include:

-   `--debug`: Will print additional logging information when running.
-   `--output-path`: Will output the results to a file, must be either HTML or JSON.
-   `--view`: Can be used with --output-path above to open the file after it is saved.

## References

-   Lighthouse Docs: https://github.com/GoogleChrome/lighthouse/tree/master/docs
-   Puppeteer Docs: https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md
-   Chrome DevTools Protocol: https://chromedevtools.github.io/devtools-protocol/
-   HAR Spec: https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/HAR/Overview.html
