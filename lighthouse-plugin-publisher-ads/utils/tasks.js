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


/**
 * Returns the attributable script for this long task.
 * @param {LH.Artifacts.TaskNode} longTask
 * @param {Set<string>=} knownScripts
 * @return {string}
 */
function getAttributableUrl(longTask, knownScripts = new Set()) {
  const scriptUrl = longTask.attributableURLs.find(
    /** @param {string} url */ (url) => knownScripts.has(url));
  const fallbackUrl = longTask.attributableURLs[0];
  const attributableUrl = scriptUrl || fallbackUrl;

  if (attributableUrl) {
    return attributableUrl;
  }
  let maxChildDuration = 50; // Filter children with duration < 50ms.
  let childUrl = '';
  for (const child of longTask.children) {
    const url = getAttributableUrl(child, knownScripts);
    if (url && child.duration > maxChildDuration) {
      childUrl = url;
      maxChildDuration = child.duration;
    }
  }
  return childUrl;
}

export {getAttributableUrl};
