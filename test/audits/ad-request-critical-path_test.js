const AdRequestCriticalPath = require('../../audits/ad-request-critical-path');
const {expect} = require('chai');

describe('AdRequestCriticalPath', () => {
  const testCases = [
    {
      filePath: './har-test-files/non-ads-entries',
      desc: 'non-ads entries',
      expectedScore: 1,
      expectedRawValue: 0,
    },
    {
      filePath: './har-test-files/non-script-entries',
      desc: 'non-script entries',
      expectedScore: 1,
      expectedRawValue: 0,
    },
    {
      filePath: './har-test-files/ads-related-entry',
      desc: 'ads-related entry',
      expectedScore: 1,
      expectedRawValue: 2,
    },
    {
      filePath: './har-test-files/multiple-entries',
      desc: 'multiple blocking entries',
      expectedScore: 0,
      expectedRawValue: 4,
    },
    {
      filePath: './har-test-files/multiple-dependencies',
      desc: 'multiple dependencies',
      expectedScore: 0,
      expectedRawValue: 5,
    },
    {
      filePath: './har-test-files/blank-initiator-details',
      desc: 'blank initiator details entry',
      expectedScore: 1,
      expectedRawValue: 1,
    },
    {
      filePath: './har-test-files/diamond-dependency',
      desc: 'diamond dependency structure',
      expectedScore: 0,
      expectedRawValue: 5,
    },
    {
      filePath: './har-test-files/multiple-pubads-single',
      desc: 'multiple pubads function calls on stack',
      expectedScore: 0,
      expectedRawValue: 4,
    },
    {
      filePath: './har-test-files/cycle',
      desc: 'a cycle in the stack',
      expectedScore: 0,
      expectedRawValue: 7,
    },
    {
      filePath: './har-test-files/not-in-graph',
      desc: 'an entry but has a call frame that is not in the dependency graph',
      expectedScore: 1,
      expectedRawValue: 2,
    },
    {
      filePath: './har-test-files/multiple-pubads-entries',
      desc: 'multiple pubads function calls in callFrames array',
      expectedScore: 0,
      expectedRawValue: 4,
    },
  ];
  for (const {filePath, desc, expectedScore, expectedRawValue} of testCases) {
    it(`should return ${expectedScore} for ${desc} w/ raw value 
        ${expectedRawValue}`, () => {
      const har = require(filePath);
      const results = AdRequestCriticalPath.audit({Network: {har}});

      expect(results).to.have.property('score', expectedScore);
      expect(results).to.have.property('rawValue', expectedRawValue);
    });
  }
});
