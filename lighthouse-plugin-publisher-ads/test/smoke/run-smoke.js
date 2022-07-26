// Copyright 2020 Google LLC
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
'use strict';

/* eslint-disable no-console */
import { promisify } from 'util'; // eslint-disable-line
import {exec} from 'child_process';
import url from 'url';
import path from 'path';
import StaticServer from 'static-server';
import {execSync} from 'child_process';

const execAsync = promisify(exec);

/**
 * @param {ImportMeta} importMeta
 */
function getModulePath(importMeta) {
  return url.fileURLToPath(importMeta.url);
}

/**
 * @param {ImportMeta} importMeta
 */
function getModuleDirectory(importMeta) {
  return path.dirname(getModulePath(importMeta));
}

const moduleDir = getModuleDirectory(import.meta);

const server = new StaticServer({
  rootPath: `${moduleDir}/fixtures`,
  port: 8081,
});

/**
 * Temporarily move files into core Lighthouse to allow for smokehouse usage.
 */
function init() {
  const cmd = [
    'cd node_modules/lighthouse',
    'ln -sf ../../lighthouse-plugin-publisher-ads ' +
    'lighthouse-plugin-publisher-ads',
  ];
  execSync(cmd.join(' && '));
}

/**
 * Main function. Run webservers, smokehouse, then report on failures
 */
async function run() {
  console.log('Running Smoke Tests');
  init();
  server.start(() => {
    console.log('Fixtures hosted on port :' + server.port);
  });
  execAsync(
    'cd node_modules/lighthouse && ' +
    'node lighthouse-cli/test/smokehouse/frontends/smokehouse-bin.js --tests-path ../../lighthouse-plugin-publisher-ads/test/smoke/smoke-test-dfns.js --retries 3',
  )
      .then((result) => {
        process.stdout.write(result.stdout);
        process.exit(0);
      })
      .catch((e) => {
        process.stdout.write(e.stdout || String(e));
        process.stderr.write(e.stderr || String(e));
        process.exit(1);
      });
}

run().catch((e) => {
  process.stderr.write(e.stderr || String(e));
  process.exit(1);
});
