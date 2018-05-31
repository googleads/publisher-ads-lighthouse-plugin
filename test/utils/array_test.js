const array = require('../../utils/array');
const {expect} = require('chai');

describe('array', () => {
  describe('#count', () => {
    it('should handle empty arrays', () => {
      const num = array.count([], (n) => n >= 10);
      expect(num).to.equal(0);
    });

    it('should handle non-empty arrays', () => {
      const num = array.count([0, 10, 0, 10, 0], (n) => n >= 10);
      expect(num).to.equal(2);
    });
  });
});
