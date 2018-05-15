const array = require('../utils/array.js');
const {Gatherer} = require('lighthouse');

class Ads extends Gatherer {
  /** @override */
  async afterPass(passContext, loadData) {
    const numRequests = array.count(
        loadData.networkRecords, (req) => req.url.includes('/gampad/ads?'));
    return {numRequests};
  }
}

module.exports = Ads;
