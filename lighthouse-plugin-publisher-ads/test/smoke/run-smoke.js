/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-disable no-console */
const {promisify} = require('util');
const execAsync = promisify(require('child_process').exec);
const {execSync} = require('child_process');
const StaticServer = require('static-server');
const log = require('lighthouse-logger');

const SMOKEHOUSE_PATH = require.resolve('lighthouse/lighthouse-cli/test/smokehouse/smokehouse.js');
const CLI_ROOT = SMOKEHOUSE_PATH.replace('/test/smokehouse/smokehouse.js','');
const TMP_DIR = `${CLI_ROOT}/test/smokehouse/.tmp`
const CORE_DFNS_PATH = `${CLI_ROOT}/test/smokehouse/smoke-test-dfns.js`;
const CUSTOM_DFNS_PATH = require.resolve('./smoke-test-dfns.js');


const server = new StaticServer({
    rootPath: `${__dirname}/fixtures`,
    port: 8081,
});

// The `init()` and `cleanUp()` functions are both hacks to be able to use 
// the Lighthouse instance of smokehouse.js.
function init() {
    const cmd = [
        // Backup core dfns file.
        `mv ${CORE_DFNS_PATH} ${CORE_DFNS_PATH}.backup`,
        // Symlink custom dfns file.
        `ln -sf ${CUSTOM_DFNS_PATH} ${CORE_DFNS_PATH}`,
        // Create and symlink local `.tmp` directory.
        `mkdir -p .tmp`,
        `ln -sf ./.tmp ${TMP_DIR}`,
        // Symlink `lighthouse-cli` in root.
        `ln -sf ${CLI_ROOT} .`
    ];
    execSync(cmd.join(' && '));
}

function cleanUp() {
    const cmd = [
    // Remove symlinked dfns file.
    `rm ${CORE_DFNS_PATH}`,
    // Restore backup dfns file.
    `mv ${CORE_DFNS_PATH}.backup ${CORE_DFNS_PATH}`,
    // Remove local and core `.tmp` dirs.
    `rm -r .tmp`,
    `rm ${TMP_DIR}`,
    // Remove symlinked `lighthouse-cli`.
    `rm lighthouse-cli`,
    ];
    execSync(cmd.join(' && '));
}

init();

/** @param {string} str */
const purpleify = str => `${log.purple}${str}${log.reset}`;
const smokeTests = require('./smoke-test-dfns.js');

/**
 * Display smokehouse output from child process
 * @param {{id: string, stdout: string, stderr: string, error?: Error}} result
 */
function displaySmokehouseOutput(result) {
  console.log(`\n${purpleify(result.id)} smoketest results:`);
  if (result.error) {
    console.log(result.error.message);
  }
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  console.timeEnd(`smoketest-${result.id}`);
  console.log(`${purpleify(result.id)} smoketest complete. \n`);
  return result;
}

/**
 * Run smokehouse in child processes for the selected smoke tests
 * Display output from each as soon as they finish, but resolve function when ALL are complete
 * @param {Array<Smokehouse.TestDfn>} smokeTests
 * @return {Promise<Array<{id: string, error?: Error}>>}
 */
async function runSmokehouse(smokeTests) {
  const cmdPromises = [];
  for (const {id} of smokeTests) {
    console.log(`${purpleify(id)} smoketest starting…`);
    console.time(`smoketest-${id}`);
    const cmd = [
      `node ${SMOKEHOUSE_PATH}`,
      `--smoke-id=${id}`,
    ].join(' ');

    // The promise ensures we output immediately, even if the process errors
    const p = execAsync(cmd, {timeout: 6 * 60 * 1000, encoding: 'utf8'})
      .then(cp => ({id, ...cp}))
      .catch(err => ({id, stdout: err.stdout, stderr: err.stderr, error: err}))
      .then(result => displaySmokehouseOutput(result));

    // If the machine is terribly slow, we'll run all smoketests in succession, not parallel
    if (process.env.APPVEYOR) {
      await p;
    }
    cmdPromises.push(p);
  }

  return Promise.all(cmdPromises);
}

/**
 * Determine batches of smoketests to run, based on argv
 * @param {string[]} argv
 * @return {Map<string|undefined, Array<Smokehouse.TestDfn>>}
 */
function getSmoketestBatches(argv) {
  let smokes = [];
  const usage = `    ${log.dim}yarn smoke ${smokeTests.map(t => t.id).join(' ')}${log.reset}\n`;

  if (argv.length === 0) {
    smokes = smokeTests;
    console.log('Running ALL smoketests. Equivalent to:');
    console.log(usage);
  } else {
    smokes = smokeTests.filter(test => argv.includes(test.id));
    console.log(`Running ONLY smoketests for: ${smokes.map(t => t.id).join(' ')}\n`);
  }

  const unmatchedIds = argv.filter(requestedId => !smokeTests.map(t => t.id).includes(requestedId));
  if (unmatchedIds.length) {
    console.log(log.redify(`Smoketests not found for: ${unmatchedIds.join(' ')}`));
    console.log(usage);
  }

  // Split into serial batches that will run their tests concurrently
  const batches = smokes.reduce((map, test) => {
    const batch = map.get(test.batch) || [];
    batch.push(test);
    return map.set(test.batch, batch);
  }, new Map());

  return batches;
}

/**
 * Main function. Run webservers, smokehouse, then report on failures
 */
async function cli() {
    server.start(() => {
        console.log('Server listening to', server.port);
    });

  const argv = process.argv.slice(2);
  const batches = getSmoketestBatches(argv);

  const smokeDefns = new Map();
  const smokeResults = [];
  for (const [batchName, batch] of batches) {
    console.log(`Smoketest batch: ${batchName || 'default'}`);
    for (const defn of batch) {
      smokeDefns.set(defn.id, defn);
    }

    const results = await runSmokehouse(batch);
    smokeResults.push(...results);
  }

  let failingTests = smokeResults.filter(result => !!result.error);

  // Automatically retry failed tests in CI to prevent flakes
  if (failingTests.length && (process.env.RETRY_SMOKES || process.env.CI)) {
    console.log('Retrying failed tests...');
    for (const failedResult of failingTests) {
      /** @type {number} */
      const resultIndex = smokeResults.indexOf(failedResult);
      const smokeDefn = smokeDefns.get(failedResult.id);
      smokeResults[resultIndex] = (await runSmokehouse([smokeDefn]))[0];
    }
  }

  failingTests = smokeResults.filter(result => !!result.error);

  if (failingTests.length) {
    const testNames = failingTests.map(t => t.id).join(', ');
    console.error(log.redify(`We have ${failingTests.length} failing smoketests: ${testNames}`));
    cleanUp();
    process.exit(1);
  }
  cleanUp();
  process.exit(0);
}

cli().catch(e => {
  console.error(e);
  cleanUp();
  process.exit(1);
});