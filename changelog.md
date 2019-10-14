<a name="0.4.0"></a>
# 0.4.0 (2019-10-14)

## Notable changes
* Add AdSense Support ([#119](https://github.com/googleads/publisher-ads-lighthouse-plugin/pull/119))
* Include smoke tests using Lighthouse's smokehouse ([#137](https://github.com/googleads/publisher-ads-lighthouse-plugin/pull/137))

## Audits
* ad-render-blocking-resources: Make audit use display mode `binary` instead of `numeric` ([#123](https://github.com/googleads/publisher-ads-lighthouse-plugin/pull/123))
* ad-render-blocking-resources: Update audit to check all sync resources ([#142](https://github.com/googleads/publisher-ads-lighthouse-plugin/pull/142))
* ad-request-critical path: Mark as informative ([#116](https://github.com/googleads/publisher-ads-lighthouse-plugin/pull/116))
* blocking-load-event: Make audit not applicable when there are no ad related requests ([#135](https://github.com/googleads/publisher-ads-lighthouse-plugin/pull/135))
* bottleneck-requests: Tune audit ([#118](https://github.com/googleads/publisher-ads-lighthouse-plugin/pull/118))
* first-ad-paint: Modify audit to use impression ping. ([#121](https://github.com/googleads/publisher-ads-lighthouse-plugin/pull/121))
* first-ad-render: Enable audit for AdSense ([#126](https://github.com/googleads/publisher-ads-lighthouse-plugin/pull/126))
* first-ad-render: Rename audit from `first-ad-paint` ([#125](https://github.com/googleads/publisher-ads-lighthouse-plugin/pull/125))
* idle-network-times: Remove from config ([#136](https://github.com/googleads/publisher-ads-lighthouse-plugin/pull/136))
* loads-ad-tag-over-https: Remove redundant and broken failureDisplayValue ([#130](https://github.com/googleads/publisher-ads-lighthouse-plugin/pull/130))

## Messages
* Update link in `script-injected-tags` audit. ([#129](https://github.com/googleads/publisher-ads-lighthouse-plugin/pull/129))

## Plugin
* Sort plugin.js ([#114](https://github.com/googleads/publisher-ads-lighthouse-plugin/pull/114))
* Disable simulated throttling by default. ([#120](https://github.com/googleads/publisher-ads-lighthouse-plugin/pull/120))
* Upgrade to Lighthouse 5.4.0 ([#132](https://github.com/googleads/publisher-ads-lighthouse-plugin/pull/132))

## Tests
* Fix missed type errors and ensure type checking WAI in travis ([#134](https://github.com/googleads/publisher-ads-lighthouse-plugin/pull/134))
* Include smoke tests using Lighthouse's smokehouse ([#137](https://github.com/googleads/publisher-ads-lighthouse-plugin/pull/137))
* Add smoke test to ensure all audits are not applicable when there are no ads ([#141](https://github.com/googleads/publisher-ads-lighthouse-plugin/pull/141))

## CLI
* Include `--full` flag to run all Lighthouse categories ([#139](https://github.com/googleads/publisher-ads-lighthouse-plugin/pull/139))

## Utils
* Update pubads_impl regex to cover edge cases. ([#140](https://github.com/googleads/publisher-ads-lighthouse-plugin/pull/140))

[Full Changelog](https://github.com/googleads/publisher-ads-lighthouse-plugin/compare/8d00c83877d60c4fdd1e52a9934bd33a198dce26...v0.4.0)