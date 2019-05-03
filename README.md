# Publisher Ads Audits for Lighthouse (Alpha)

Publisher Ads Audits for Lighthouse is a tool to improve ad speed and overall quality through a series of automated audits. At the moment, this is primarily targeted at sites using Google Ad Manager. This tool will aid in resolving discovered problems, providing a tool to be used to evaluate effectiveness of iterative changes while suggesting actionable feedback.

Publisher Ads Audits for Lighthouse is a plugin for [Lighthouse](https://github.com/GoogleChrome/lighthouse), an open-sourced tool integrated into Chrome dev tools that is widely used by developers.

We are currently in alpha and still in the development process. In order to help us improve please [file an issue](https://github.com/googleads/pub-ads-lighthouse-plugin/issues) to let us know of any issues or suggestions you may have.

## Setup

```sh
git clone git@github.com:googleads/pub-ads-lighthouse-plugin.git
cd ad-speed-insights
yarn
```

## Run

```sh
node index.js <url>
```

Available options:
-   `--view`: Open report in Chrome after execution.
-   Any other [Lighthouse flags](https://github.com/GoogleChrome/lighthouse/#cli-options).

Some common options are:

-   `--additional-trace-categories=performance` to include general web
    performance audits.
-   `--emulated-form-factor=desktop` to run on the desktop version of the site.
-   `--extra-headers "{\"Cookie\":\"monster=blue\"}"` to include additional
    cookies on all requests.

## Tests
```sh
# Lint and test all files.
yarn test
```


## Contributions

See [CONTRIBUTING.md](https://github.com/googleads/pub-ads-lighthouse-plugin/blob/master/lighthouse-plugin-ad-speed-insights/CONTRIBUTING.md)

## Web App

We currently have a web app version of Publisher Ads Audits for Lighthouse. It is currently in preview, if you'd like to request access you can do so [here](https://forms.gle/1tYvRjrkwPXYUpLW8).




## References

-   Lighthouse Docs: https://github.com/GoogleChrome/lighthouse
-   DevTools Protocol: https://chromedevtools.github.io/devtools-protocol
