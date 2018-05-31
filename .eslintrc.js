module.exports = {
  extends: ['eslint:recommended', 'google'],
  env: {
    'es6': true,
    'node': true,
    'mocha': true,
  },
  parserOptions: {
    'ecmaVersion': 2017,
    'sourceType': 'module',
  },
  rules: {
    "indent": ["error", 2],
  }
};
