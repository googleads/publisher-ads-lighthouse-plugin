# Lighthouse CI Usage

In order to prevent unexpected ad performance regressions, 
[Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) can be integrated 
with your existing CI to ensure that scores do not regress with code changes.

"Lighthouse CI is a suite of tools that make continuously running, saving, 
retrieving, and asserting against 
[Lighthouse](https://github.com/GoogleChrome/lighthouse) results as easy as 
possible."

Today, this tool is compatible with GitHub Actions, Travis CI, Circle CI, GitLab CI, Jenkins, and Google Cloudbuild.

If not familiar with Lighthouse CI, please familiarize yourself with their 
[Getting Started documentation](https://github.com/GoogleChrome/lighthouse-ci/blob/master/docs/getting-started.md#github-app-method-recommended) 
prior to starting.

## Config

Lighthouse CI natively supports plugin usage and Publisher Ads Audits can be 
easily included. Simply include the plugin in the generated reports by setting 
the `settings.plugins` attribute in the `lighthouserc.js` `collect` config.

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

The assertion framework can be used to ensure that scores and metrics remain 
within a desired threshold.

The simplest setup would involve only asserting the score of the 
`lighthouse-plugin-publisher-ads` category:
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

With the above example, we are ensuring that all audits are passing with a final
 score of 100%. If a change is ever pushed reducing this score, it will be caught 
 by CI checks, in our specific CI setup this would prevent merging until resolved.

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

Learn more about assertions 
[here](https://github.com/GoogleChrome/lighthouse-ci/blob/master/docs/configuration.md#assert).

## Example

A Lighthouse CI 
[usage example](https://github.com/googleads/publisher-ads-lighthouse-plugin/blob/master/lighthouserc.js)
 exists in this repository, ran against 2 mock pages. This example utilizes GitHub Actions and the 
 Lighthouse CI GitHub app for the simplest setup. However, the same assertions 
 can be integrated with 
 [many other popular CI providers](https://github.com/GoogleChrome/lighthouse-ci/blob/master/docs/getting-started.md#configure-your-ci-provider).