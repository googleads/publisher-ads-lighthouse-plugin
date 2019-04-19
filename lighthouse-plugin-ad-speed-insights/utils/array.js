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
 * Counts how many elements of the array match the given predicate.
 * @param {Array<T>} arr
 * @param {function(T): boolean} pred
 * @return {number}
 * @template T
 */
function count(arr, pred) {
  let num = 0;
  for (const el of arr) {
    if (pred(el)) {
      num++;
    }
  }
  return num;
}

/**
 * Sorts an array into buckets depending on a splitting function.
 * We use the type 'any' because the bucket function works on any type, and
 * returns an object of arrays of any type. The type is not specified.
 * @param {Array<any>} array
 * @param {function(any): any} splitter
 * @return {Object<string, Array<any>>}
 */
function bucket(array, splitter) {
  const buckets = {};
  for (const element of array) {
    const result = splitter(element);
    if (result) {
      // The result is not undefined, so either push the result to the right
      // bucket, or create it if necessary.
      const bucket = buckets[result] || (buckets[result] = []);
      bucket.push(element);
    }
  }
  return buckets;
}

/**
 * Flattens a 2-d array to a 1-d array.
 * @param {T[][]} arrs
 * @return {T[]}
 * @template {T}
 */
function flatten(arrs) {
  // Typescript compiler doesn't like spread so we invoke concat.apply()
  // eslint-disable-next-line prefer-spread
  return [].concat.apply([], ...arrs);
}

module.exports = {
  count, bucket, flatten,
};
