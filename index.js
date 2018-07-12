// @ts-ignore
const ChromeLauncher = require('chrome-launcher');
const config = require('./config');
const fs = require('fs-extra');
const lighthouse = require('lighthouse');
const opn = require('opn');
const util = require('util');
// @ts-ignore any
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
 * Returns audits in a sorted list.
 * @param {LH.RunnerResult} result
 * @return {Array<LH.Audit.Result>}
 */
function getAudits(result) {
  return Object.values(result.lhr.audits)
    .sort((a, b) => (a.id > b.id) ? 1 : -1);
}

/**
 * Prints audit info to the console.
 * @param {LH.Audit.Result} audit
 */
function printAudit(audit) {
  const {id, displayValue, errorMessage} = audit;
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

/**
 * Outputs the HTML report, if specified by the user.
 * @param {LH.RunnerResult} results
 */
async function outputReport(results) {
  const outputPath = argv.outputPath;
  if (outputPath) {
    console.log(`Writing output to ${outputPath}`);
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
    const startTime = Date.now();

    const browser = await ChromeLauncher.launch({chromeFlags: ['--headless']});
    console.log('Launched headless chrome');
    flags.port = browser.port;

    const results = await lighthouse(argv.url, flags, config);
    await browser.kill();

    // Print audit info to the console.
    getAudits(results).forEach(printAudit);

    // Output the HTML report, if specified.
    await outputReport(results);

    const endTime = Date.now();
    console.log(`Took ${((endTime - startTime) / 1000).toFixed(2)} seconds.`);

    process.exit(0);
  } catch (e) {
    console.error('---ERROR---');
    console.error(e.message);
    console.error(e.stack);
    process.exit(1);
  }
}

if (require.main == module) {
  main();
}

module.exports = {
  isDebugMode: () => argv.debug,
};
