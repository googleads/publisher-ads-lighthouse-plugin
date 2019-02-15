# Ad Speed Insights (Alpha)

Ad Speed Insights is a tool to improve ad speed and overall quality through a series of automated audits. At the moment, this is primarily targeted at sites using Google Ad Manager. This tool will aid in resolving discovered problems, providing a tool to be used to evaluate effectiveness of iterative changes while suggesting actionable feedback.

Ad Speed Insights is built on top of [Lighthouse](https://github.com/GoogleChrome/lighthouse), an open-sourced tool integrated into Chrome dev tools that is widely used by developers.

We are currently in alpha and still in the development process. In order to help us improve please [file an issue](https://github.com/googleads/ad-speed-insights/issues) to let us know of any issues or suggestions you may have.

## Setup

```sh
git clone git@github.com:googleads/ad-speed-insights.git
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

## Tests
```sh
# Lint and test all files.
yarn test
```


## Contributions

See [CONTRIBUTING.md](https://github.com/googleads/ad-speed-insights/blob/master/CONTRIBUTING.md)




## References

-   Lighthouse Docs: https://github.com/GoogleChrome/lighthouse
-   DevTools Protocol: https://chromedevtools.github.io/devtools-protocol