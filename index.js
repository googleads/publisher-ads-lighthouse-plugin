// TODO(warrengm): Add types for lighthouse.
// @ts-ignore
const ChromeLauncher = require('chrome-launcher');
const lighthouse = require('lighthouse');
// @ts-ignore any
const {argv} = require('yargs');

const auditsConfig = require('./audits/config');

/**
 * Flags for running lighthouse. See
 * https://github.com/GoogleChrome/lighthouse/blob/master/typings/externs.d.ts
 * @type {!LH.Flags}
 */
const flags = {
  json: true,
  runs: 1,
};

/**
 * Launch chrome instance and run lighthouse with custom config
 */
async function main() {
  /* eslint-disable no-console */
  try {
    const browser = await ChromeLauncher.launch({chromeFlags: ['--headless']});
    console.log('Launched headless chrome');
    flags.port = browser.port;

    const results = await lighthouse(argv.url, flags, auditsConfig);
    await browser.kill();

    for (const {name, displayValue} of Object.values(results.audits)) {
      if (displayValue) {
        console.log(name, ':', displayValue);
      }
    }
    process.exit(0);
  } catch (e) {
    console.error('---ERROR---');
    console.error(e.message);
    console.error(e.stack);
    process.exit(1);
  }
  /* eslint-enable no-console */
}

if (require.main == module) {
  main();
}

module.exports = {
  isDebugMode: () => argv.debug,
}
