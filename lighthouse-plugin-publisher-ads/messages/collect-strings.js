// Copyright 2019 Google LLC
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

// Forked from Lighthouse:
//   https://github.com/GoogleChrome/lighthouse/blob/main/core/scripts/i18n/collect-strings.js
'use strict';

/* eslint-disable no-console, max-len */

import esprima from 'esprima';

import fs from 'fs';
import path from 'path';
import url, {pathToFileURL} from 'url';

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

const LH_ROOT = path.join(moduleDir, '../');
const UISTRINGS_REGEX = /UIStrings = (.|\s)*?\};\n/im;

/**
 * @typedef ICUMessageDefn
 * @property {string} message
 * @property {string} [description]
 */

const ignoredPathComponents = [
  '/.git',
  '/node_modules',
  '/test/',
  '-test.js',
  '-renderer.js',
  'collect-strings.js',
];

/**
 * @param {*} ast
 * @param {*} property
 * @param {*} startRange
 */
function computeDescription(ast, property, startRange) {
  const endRange = property.range[0];
  for (const comment of ast.comments || []) {
    if (comment.range[0] < startRange) continue;
    if (comment.range[0] > endRange) continue;
    return comment.value.replace('*', '').trim();
  }

  return '';
}

/**
 * @param {string} dir
 * @param {Record<string, ICUMessageDefn>} strings
 */
async function collectAllStringsInDir(dir, strings = {}) {
  for (const name of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, name);
    const relativePath = path.relative(LH_ROOT, fullPath);
    if (ignoredPathComponents.some((p) => fullPath.includes(p))) continue;

    if (fs.statSync(fullPath).isDirectory()) {
      await collectAllStringsInDir(fullPath, strings);
    } else {
      if (name.endsWith('.js')) {
        if (!process.env.CI) console.log('Collecting from', relativePath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const exportVars = await import(pathToFileURL(fullPath).href);
        const regexMatches = !!UISTRINGS_REGEX.test(content);
        const exportedUIStrings = exportVars.UIStrings || exportVars.default?.UIStrings;
        if (!regexMatches && !exportedUIStrings) continue;

        if (regexMatches && !exportedUIStrings) {
          throw new Error('UIStrings defined but not exported');
        }

        if (exportedUIStrings && !regexMatches) {
          throw new Error('UIStrings exported but no definition found');
        }

        // @ts-ignore regex just matched
        const justUIStrings = 'const ' + content.match(UISTRINGS_REGEX)[0];
        // just parse the UIStrings substring to avoid ES version issues, save time, etc
        // @ts-ignore - esprima's type definition is supremely lacking
        const ast = esprima.parse(justUIStrings, {comment: true, range: true});

        for (const stmt of ast.body) {
          if (stmt.type !== 'VariableDeclaration') continue;
          if (stmt.declarations[0].id.name !== 'UIStrings') continue;

          let lastPropertyEndIndex = 0;
          for (const property of stmt.declarations[0].init.properties) {
            const key = property.key.name;
            const message = exportVars.UIStrings[key];
            const description = computeDescription(ast, property, lastPropertyEndIndex);
            strings[`${relativePath} | ${key}`] = {message, description};
            lastPropertyEndIndex = property.range[1];
          }
        }
      }
    }
  }

  return strings;
}

/**
 * @param {Record<string, ICUMessageDefn>} strings
 */
function createPsuedoLocaleStrings(strings) {
  /** @type {Record<string, ICUMessageDefn>} */
  const psuedoLocalizedStrings = {};
  for (const [key, defn] of Object.entries(strings)) {
    const message = defn.message;
    const psuedoLocalizedString = [];
    let braceCount = 0;
    let useHatForAccentMark = true;
    for (const char of message) {
      psuedoLocalizedString.push(char);
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
      }

      // Hack to not change {plural{ICU}braces} nested an odd number of times.
      // ex: "{itemCount, plural, =1 {1 link found} other {# links found}}"
      // becomes "{itemCount, plural, =1 {1 l̂ín̂ḱ f̂óûńd̂} other {# ĺîńk̂ś f̂óûńd̂}}"
      // ex: "{itemCount, plural, =1 {1 link {nested_replacement} found} other {# links {nested_replacement} found}}"
      // becomes: "{itemCount, plural, =1 {1 l̂ín̂ḱ {nested_replacement} f̂óûńd̂} other {# ĺîńk̂ś {nested_replacement} f̂óûńd̂}}"
      if (braceCount % 2 === 1) continue;

      // Add diacritical marks to the preceding letter, alternating between a hat ( ̂) and an acute (´).
      if (/[a-z]/i.test(char)) {
        psuedoLocalizedString.push(useHatForAccentMark ? `\u0302` : `\u0301`);
        useHatForAccentMark = !useHatForAccentMark;
      }
    }

    psuedoLocalizedStrings[key] = {message: psuedoLocalizedString.join('')};
  }

  return psuedoLocalizedStrings;
}

/**
 * @param {string} locale
 * @param {Record<string, ICUMessageDefn>} strings
 */
function writeStringsToLocaleFormat(locale, strings) {
  const fullPath = path.join(LH_ROOT, `messages/${locale}.json`);
  /** @type {Record<string, ICUMessageDefn>} */
  const output = {};
  const sortedEntries = Object.entries(strings).sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
  for (const [key, defn] of sortedEntries) {
    output[key] = defn;
  }

  fs.writeFileSync(fullPath, JSON.stringify(output, null, 2) + '\n');
}

const strings = await collectAllStringsInDir(LH_ROOT);
const psuedoLocalizedStrings = createPsuedoLocaleStrings(strings);
console.log('Collected from LH core!');

writeStringsToLocaleFormat('en-US', strings);
writeStringsToLocaleFormat('locales/en-XL', psuedoLocalizedStrings);
console.log('Written to disk!');
