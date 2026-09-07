import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { futureValue, projectRetirement } from '@/src/lib/retirement';

describe('retirement projection', () => {
  it('compounds monthly and reports on-track', () => {
    const projected = futureValue(10000, 100, 0, 12);
    assert.equal(projected, 11200);

    const result = projectRetirement({
      currentAge: 30,
      retirementAge: 31,
      currentBalance: 10000,
      monthlyContribution: 100,
      expectedReturn: 0,
      targetNestEgg: 10000,
    });
    assert.equal(result.onTrack, true);
    assert.equal(result.projected, 11200);
  });
});
