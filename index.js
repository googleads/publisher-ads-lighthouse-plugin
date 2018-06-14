const util = require('util');

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
const flags = /** @type {LH.Flags} */ ({});

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

    const audits = Object.values(results.lhr.audits)
      .sort((a, b) => (a.id > b.id) ? 1 : -1);
    for (const {id, displayValue, errorMessage} of audits) {
      if (errorMessage) {
        console.log('ERROR:', id, errorMessage);
      }
      // Note that display value is sometimes a string and sometimes an array
      // for string formatting, like ['%d ms', 4].
      if (displayValue) {
        const display = typeof displayValue == 'string' ?
          displayValue : util.format.call(null, ...displayValue);
        console.log(id, ':', display);
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
};
