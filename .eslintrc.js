module.exports = {
  extends: ['eslint:recommended', 'google'],
  env: {
    es6: true,
    node: true,
    mocha: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'script',
  },
  rules: {
    'indent': ['error', 2],
    'max-len': ['error', 80, {
      ignoreStrings: true,
      ignoreUrls: true,
    }],
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-body-style': ['error', 'as-needed'],
  },
};
