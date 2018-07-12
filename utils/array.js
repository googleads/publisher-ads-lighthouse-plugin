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

module.exports = {
  count, bucket,
};
