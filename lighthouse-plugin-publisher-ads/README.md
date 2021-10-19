# Publisher Ads Audits for Lighthouse
[![Linux Build Status](https://img.shields.io/travis/googleads/publisher-ads-lighthouse-plugin/master.svg)](https://travis-ci.org/googleads/publisher-ads-lighthouse-plugin)
[![NPM lighthouse package](https://img.shields.io/npm/v/lighthouse-plugin-publisher-ads.svg)](https://npmjs.org/package/lighthouse-plugin-publisher-ads)

Publisher Ads Audits for Lighthouse is a tool to improve ad speed and overall quality through a series of automated audits. At the moment, this is primarily targeted at sites using Google Ad Manager. This tool will aid in resolving discovered problems, providing a tool to be used to evaluate effectiveness of iterative changes while suggesting actionable feedback.

This tool is a plugin for [Lighthouse](https://github.com/GoogleChrome/lighthouse), an open-sourced tool integrated into Chrome dev tools that is widely used by developers.

In order to help us improve please [file an issue](https://github.com/googleads/publisher-ads-lighthouse-plugin/issues) to let us know of any issues or suggestions you may have.

:warning: | Publisher Ads Audits for Lighthouse audit results aren't an indication of compliance or non-compliance with any [Google Publisher Policies](https://support.google.com/publisherpolicies/answer/10502938).
:---: | :---

## Web App

We currently have a web app version of Publisher Ads Audits for Lighthouse. It can be accessed at [developers.google.com/publisher-ads-audits](https://developers.google.com/publisher-ads-audits/).

## Lighthouse Node CLI

Publisher Ads Audits is available as a [node package](https://npmjs.org/package/lighthouse-plugin-publisher-ads) which can be used with the Lighthouse CLI.

### Setup
```sh
mkdir pub-ads-audits-wrapper && cd pub-ads-audits-wrapper && \
npm init -y && \
yarn add -D lighthouse && \
yarn add -D lighthouse-plugin-publisher-ads
```

### Usage
>From within `wrapper` directory
```sh
yarn lighthouse {url} --plugins=lighthouse-plugin-publisher-ads
```
See [Lighthouse documentation](https://github.com/GoogleChrome/lighthouse/#cli-options) for additional options.

## Development

### Setup

```sh
git clone git@github.com:googleads/publisher-ads-lighthouse-plugin.git
cd publisher-ads-lighthouse-plugin
yarn
```

### Usage

```sh
node index.js <url>
```

Available options:
-   `--view`: Open report in Chrome after execution.
-   `--full`: Run all Lighthouse categories.
-   Any other [Lighthouse flags](https://github.com/GoogleChrome/lighthouse/#cli-options).

Some common options are:

-   `--additional-trace-categories=performance` to include general web
    performance audits.
-   `--emulated-form-factor=desktop` to run on the desktop version of the site.
-   `--extra-headers "{\"Cookie\":\"monster=blue\"}"` to include additional
    cookies on all requests.

#### Continuous Integration

This plugin can be integrated with your existing CI using Lighthouse CI to 
ensure that ad performance hasn't regressed. 
[Learn More.](https://github.com/googleads/publisher-ads-lighthouse-plugin/blob/master/lighthouse-ci/README.md)

### Tests
```sh
# Lint and test all files.
yarn test
```


## Contributions

See [CONTRIBUTING.md](https://github.com/googleads/publisher-ads-lighthouse-plugin/blob/master/CONTRIBUTING.md)




## References

-   Lighthouse Docs: https://github.com/GoogleChrome/lighthouse
-   DevTools Protocol: https://chromedevtools.github.io/devtools-protocol
