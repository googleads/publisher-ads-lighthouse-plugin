const array = require('../../utils/array');
const {expect} = require('chai');
const {isGoogleAds} = require('../../utils/resource-classification');
const {URL} = require('url');

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

  describe('#bucket', () => {
    const RequestType = {
      AD: 'ad',
      UNKNOWN: 'unknown',
    };

    /**
     * Checks the type of record.
     * @param {NetworkDetails.RequestRecord} record
     * @return {string}
     */
    function checkRecordType(record) {
      if (isGoogleAds(new URL(record.url))) {
        return RequestType.AD;
      } else {
        return RequestType.UNKNOWN;
      }
    }

    it('should handle empty arrays', () => {
      const records = [];
      const results = array.bucket(records, checkRecordType);
      expect(results).to.eql({});
    });

    it('should handle non-empty arrays', () => {
      const records = [
        {
          startTime: 10,
          endTime: 20,
          url: 'https://example.com',
        },
        {
          startTime: 15,
          endTime: 30,
          url: 'https://foo.uk.com',
        },
        {
          startTime: 65,
          endTime: 70,
          url: 'https://securepubads.g.doubleclick.net/gampad/ads?bar',
        },
        {
          startTime: 75,
          endTime: 80,
          url: 'https://googlesyndication.com/gpt/',
        },
      ];
      const results = array.bucket(records, checkRecordType);
      expect(results).to.eql({
        'ad': [
          {
            startTime: 65,
            endTime: 70,
            url: 'https://securepubads.g.doubleclick.net/gampad/ads?bar',
          },
          {
            startTime: 75,
            endTime: 80,
            url: 'https://googlesyndication.com/gpt/',
          },
        ],
        'unknown': [
          {
            startTime: 10,
            endTime: 20,
            url: 'https://example.com',
          },
          {
            startTime: 15,
            endTime: 30,
            url: 'https://foo.uk.com',
          },
        ],
      });
    });
  });
});
