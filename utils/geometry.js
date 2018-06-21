const assert = require('assert');

/**
 * @param {?LH.Crdp.DOM.BoxModel} boxModel
 * @param {!LH.Artifacts.ViewportDimensions} viewport
 * @return {boolean}
 */
function isBoxInViewport(boxModel, viewport) {
  if (!boxModel) return false;

  const {innerWidth, innerHeight} = viewport;
  const [left, top, right, _t, _r, bottom, _l, _b] = boxModel.content;
  assert(left == _l && top == _t && right == _r && bottom == _b);

  return left < right && top < bottom && // Non-zero area
    left < innerWidth && top < innerHeight && 0 < right && 0 < bottom;
}

module.exports = {
  isBoxInViewport,
};

