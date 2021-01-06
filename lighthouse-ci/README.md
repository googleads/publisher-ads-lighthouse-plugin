# Lighthouse CI Usage

To monitor Lighthouse scores and prevent unexpected ad performance regressions, 
you can integrate [Lighthouse CI (LHCI)](https://github.com/GoogleChrome/lighthouse-ci) 
with your existing CI.

>Lighthouse CI is a suite of tools that make continuously running, saving, 
retrieving, and asserting against 
[Lighthouse](https://github.com/GoogleChrome/lighthouse) results as easy as 
possible.

Today, this tool is compatible with GitHub Actions, Travis CI, Circle CI, GitLab CI, Jenkins, and Google Cloudbuild.

If not familiar with LHCI, please familiarize yourself with their 
[Getting Started documentation](https://github.com/GoogleChrome/lighthouse-ci/blob/master/docs/getting-started.md#github-app-method-recommended) 
prior to starting.

## Config

LHCI natively supports plugins, including Publisher Ads Audits. To run
Publisher Ads Audits in your LHCI reports, simply set the `settings.plugins` 
attribute in the `lighthouserc.js` `collect` config.

Example:
```
module.exports = {
  ci: {
    // ...
    collect: {
      settings: {
        plugins: ['lighthouse-plugin-publisher-ads'],
      },
    },
    // ...
  }
```

Additionally, you must ensure that `lighthouse-plugins-publisher-ads` is 
installed in your CI environment. The can be done by adding the line 
`npm install -g lighthouse-plugin-publisher-ads@1.3.x` to your CI build rule. 

We recommend setting a 
specific major and minor versions (ex: 1.3.x) to ensure that unexpected regressions are not 
due to changes in the plugin.

## Assertions

Using the assertion framework, you can ensure that scores and metrics remain 
within a desired threshold. 

See [official documentation](https://github.com/GoogleChrome/lighthouse-ci/blob/master/docs/configuration.md#assert) to learn more.

A simple setup could assert that the Publisher Ads Audits category passes with a
100% score.

Example:
```
module.exports = {
  ci: {
    // ...
    assert: {
      assertions: {
        'categories:lighthouse-plugin-publisher-ads': [
          'error',
          {'minScore': 1}, // No failing plugin audits.
        ],
      }
    },
    // ...
  }
```

With the above example, you ensure that all audits pass with a final score of 
100%. If a code chance ever reduces the score, this setup will catch it and stop 
it from being merged.

While the above example may be sufficient for your use case, lower level
assertions will be beneficial for ensuring consistent performance across the 
board, especially in cases where a perfect score is not expected.

Example:
```
module.exports = {
  ci: {
    // ...
    assert: {
      assertions: {
        'categories:lighthouse-plugin-publisher-ads': [
          'error',
          {'minScore': .8}, // Category score >= 80%.
        ],
        'first-ad-render': [
          'error',
          {
            'maxNumericValue': 10000, // <= 10s
            'minScore': 1 // Always passes audit
          },
        ],
        'tag-load-time': [
          'error',
          {'minScore': .9} // Audit score >= 90%
        ],
        'viewport-ad-density': [
          'error',
          {'maxNumericValue: .3} // Ad density <= 30%
        ]
      }
    },
    // ...
  }
```

## Example

There is an
[example LHCI configuration](https://github.com/googleads/publisher-ads-lighthouse-plugin/blob/master/lighthouserc.js)
in this repository that checks 2 mock pages. It utilizes GitHub Actions and the 
 Lighthouse CI GitHub app to demonstrate a simple setup. However, the same 
 assertions can be integrated with 
 [many other popular CI providers](https://github.com/GoogleChrome/lighthouse-ci/blob/master/docs/getting-started.md#configure-your-ci-provider).