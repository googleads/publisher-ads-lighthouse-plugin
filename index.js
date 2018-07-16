const yargs = require('yargs');

/**
 * Runs lighthouse cli with custom config.
 */
async function main() {
  if (!yargs.argv.configPath) {
    // Avoid duplicating the option
    const configPath = require.resolve('./config');
    process.argv.push(`--config-path=${configPath}`);
  }

  if (!yargs.argv.chromeFlags) {
    // TODO: merge if extra flags are specified
    process.argv.push('--chrome-flags=--headless');
  }

  // @ts-ignore let LH handle the CLI
  await require('lighthouse/lighthouse-cli/bin').run();
}

if (require.main == module) {
  main();
}

module.exports = {
  isDebugMode: () => yargs.argv.debug,
};
