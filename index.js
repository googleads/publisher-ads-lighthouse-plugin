const util = require('util');

// @ts-ignore
const ChromeLauncher = require('chrome-launcher');
const fs = require('fs-extra');
const lighthouse = require('lighthouse');
const opn = require('opn');
// @ts-ignore any
const {argv} = require('yargs');

const config = require('./config');

/**
 * Flags for running lighthouse. See
 * https://github.com/GoogleChrome/lighthouse/blob/master/typings/externs.d.ts
 * @type {LH.Flags}
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
    const outputPath = argv.outputPath || '';
    if (outputPath.endsWith('.json')) {
      flags.output = 'json';
    } else if (outputPath.endsWith('.html')) {
      flags.output = 'html';
    } else if (outputPath) {
      throw new Error(`output file must be either a .html or .json file. ` +
        `Was ${outputPath}`);
    }

    const results = await lighthouse(argv.url, flags, config);
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

    if (outputPath) {
      console.log(`Writing output to ${outputPath}`);
      await fs.outputFile(outputPath, results.report);
      if (argv.view) {
        opn(outputPath);
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
