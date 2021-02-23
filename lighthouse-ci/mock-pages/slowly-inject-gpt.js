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
// @ts-nocheck
/**
 * Simulate long task.
 * @param duration
 */
function longTask(duration) {
  const start = new Date().getTime();
  // Busy countdown.
  while (new Date().getTime() - start < duration);
}

window.addEventListener('load', (e) => { // eslint-disable-line
  longTask(5000);
  const gpt = document.createElement('script'); // eslint-disable-line
  gpt.setAttribute('src', 'http://www.googletagservices.com/tag/js/gpt.js');
  document.querySelector('body').appendChild(gpt); // eslint-disable-line
});
