const auditsConfig = require('./audits/config');
// TODO(warrengm): Add types for lighthouse.
// @ts-ignore
const lighthouse = require('lighthouse');
const puppeteer = require('puppeteer');
// @ts-ignore any
const {argv} = require('yargs');

const CHROME_REMOTE_PORT = 9222;

/**
 * Flags for running lighthouse. See
 * https://github.com/GoogleChrome/lighthouse/blob/master/typings/externs.d.ts
 * @const {!LH.Flags}
 */
const flags = {
  json: true,
  runs: 1,
  port: CHROME_REMOTE_PORT,
};

async function main() {
  try {
    const browser = await puppeteer.launch({
      args: [`--remote-debugging-port=${CHROME_REMOTE_PORT}`],
    });
    console.log('Launched headless chrome');
    const results = await lighthouse(argv.url, flags, auditsConfig);
    await browser.close();
    for (const {name, displayValue} of Object.values(results.audits)) {
      if (displayValue) {
        console.log(name, ':', displayValue);
      }
    }
    process.exit(0);
  } catch (e) {
    console.error('---ERROR---');
    console.error(e.message);
    process.exit(1);
  }
}

main();
