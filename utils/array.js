
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

module.exports = {
  count,
};
