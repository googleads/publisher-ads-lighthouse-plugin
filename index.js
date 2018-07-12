const ChromeLauncher = require('chrome-launcher');
const config = require('./config');
const fs = require('fs-extra');
const lighthouse = require('lighthouse');
const log = require('lighthouse-logger');
const opn = require('opn');
const {argv} = require('yargs');

/* eslint-disable no-console */

/**
 * Flags for running lighthouse. See
 * https://github.com/GoogleChrome/lighthouse/blob/master/typings/externs.d.ts
 * @type {LH.Flags}
 */
const flags = /** @type {LH.Flags} */ ({});

// TODO: Use yargs for flag validation.
/**
 * Validates CLI flags. It will throw an error any flags or combination of flags
 * are invalid.
 */
function validateFlags() {
  const outputPath = argv.outputPath || '';
  if (outputPath.endsWith('.json')) {
    flags.output = 'json';
  } else if (outputPath.endsWith('.html')) {
    flags.output = 'html';
  } else if (outputPath) {
    throw new Error(`output file must be either a .html or .json file. ` +
      `Was ${outputPath}`);
  }
}

/**
 * Outputs the HTML report, if specified by the user.
 * @param {LH.RunnerResult} results
 */
async function outputReport(results) {
  const outputPath = argv.outputPath;
  if (outputPath) {
    log.log('Output', `Writing output to ${outputPath}`);
    await fs.outputFile(outputPath, results.report);
    if (argv.view) {
      opn(outputPath);
    }
  }
}

/**
 * Launches chrome instance and runs lighthouse with custom config.
 */
async function main() {
  try {
    validateFlags();

    flags.logLevel = argv.logLevel || 'info';
    log.setLevel(flags.logLevel);

    const browser = await ChromeLauncher.launch({
      chromeFlags: ['--headless'],
      logLevel: flags.logLevel,
    });

    flags.port = browser.port;

    const results = await lighthouse(argv.url, flags, config);
    await browser.kill();

    // Output the HTML report, if specified.
    await outputReport(results);

    process.exit(0);
  } catch (e) {
    /* eslint-disable no-console */
    console.error('---ERROR---');
    console.error(e.message);
    console.error(e.stack);
    process.exit(1);
    /* eslint-enable no-console */
  }
}

if (require.main == module) {
  main();
}

module.exports = {
  isDebugMode: () => argv.debug,
};
