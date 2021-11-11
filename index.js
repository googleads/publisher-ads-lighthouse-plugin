// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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

  if (!yargs.argv.throttlingMethod) {
    // Enable simulation.
    process.argv.push('--throttling-method=simulate');
  }

  if (!yargs.argv.chromeFlags) {
    // TODO: merge if extra flags are specified
    process.argv.push('--chrome-flags=--headless');
  }

  if (!yargs.argv.full && !yargs.argv.onlyCategories) {
    process.argv.push('--only-categories=lighthouse-plugin-publisher-ads');
  }

  // @ts-ignore let LH handle the CLI
  await require('lighthouse/lighthouse-cli/bin.js').begin();
}

if (require.main == module) {
  main();
}
