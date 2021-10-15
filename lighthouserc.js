module.exports = {
  ci: {
    upload: {
      target: 'temporary-public-storage',
    },
    collect: {
      staticDistDir: './lighthouse-ci/mock-pages',
      settings: {
        // Only run ads and performance categories.
        onlyCategories: ['lighthouse-plugin-publisher-ads', 'performance'],
        plugins: ['lighthouse-plugin-publisher-ads'],
      },
    },
    assert: {
      assertMatrix: [
        {
          matchingUrlPattern: '.*/fast-ads.html',
          assertions: {
            // Plugin category assertions.
            'categories:lighthouse-plugin-publisher-ads': [
              'error',
              {'minScore': 1}, // No failing plugin audits.
            ],
            // Assert that specific metrics fall within desired range.
            'tag-load-time': [
              'error',
              {
                'maxNumericValue': 2350, // <= 2.35s
              },
            ],
            'ad-request-from-page-start': [
              'error',
              {
                'maxNumericValue': 2500, // <= 2.5s
              },
            ],
            'first-ad-render': [
              'error',
              {'maxNumericValue': 2800}, // <= 2.8s
            ],

            // Performance category assertions.
            'categories:performance': [
              'error',
              {'minScore': .85},
            ],
            // Assert that specific metrics fall within desired range.
            'first-contentful-paint': [
              'error',
              {'maxNumericValue': 750}, // <= .75s
            ],
            'speed-index': [
              'error',
              {'maxNumericValue': 2000}, // <= 2s
            ],
            'largest-contentful-paint': [
              'error',
              {'maxNumericValue': 750}, // <= .75s
            ],
            'interactive': [
              'error',
              {'maxNumericValue': 5000},
            ],
            'total-blocking-time': [
              'error',
              {'maxNumericValue': 750}, // <= .75s
            ],
            'cumulative-layout-shift': [
              'error',
              {'maxNumericValue': 0},
            ],
          },

        },

        {
          matchingUrlPattern: '.*/slow-ads.html',
          assertions: {
            // Plugin category assertions.
            'categories:lighthouse-plugin-publisher-ads': [
              'error',
              {'minScore': .2}, // <= 20% score
            ],
            // Assert that specific metrics fall within desired range.
            'ad-request-from-page-start': [
              'error',
              {'maxNumericValue': 24000}, // <= 24s
            ],
            'first-ad-render': [
              'error',
              {'maxNumericValue': 27000}, // <= 27s
            ],
            'cumulative-layout-shift': [
              'error',
              {'maxNumericValue': 3.54}, // <= 3.54
            ],
            'viewport-ad-density': [
              'error',
              {'maxNumericValue': .33}, // <= 33% density
            ],
            'ad-blocking-tasks': [
              'error',
              {'maxLength': 2}, // No more than 2 blocking tasks.
            ],
          },
        },
      ],
    },
  },
};
