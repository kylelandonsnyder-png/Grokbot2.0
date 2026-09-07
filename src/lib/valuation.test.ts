import assert from 'node:assert/strict';
import test from 'node:test';

import { mockValuation, parseRentcastValue } from './valuation';

test('mock valuation is deterministic and labeled mock', () => {
  const a = mockValuation('418 Oak St, Columbus, OH');
  const b = mockValuation('418 Oak St, Columbus, OH');
  assert.equal(a.estimatedValue, b.estimatedValue);
  assert.equal(a.mock, true);
  assert.match(a.source, /mock/i);
  assert.ok(a.estimatedValue > 0);
  assert.ok((a.rangeLow ?? 0) < a.estimatedValue);
  assert.ok((a.rangeHigh ?? 0) > a.estimatedValue);
});

test('different addresses get different mock values', () => {
  const oak = mockValuation('418 Oak St, Columbus, OH');
  const maple = mockValuation('22 Maple Ave, Westerville, OH');
  assert.notEqual(oak.estimatedValue, maple.estimatedValue);
});

test('RentCast parser reads price and ranges', () => {
  const parsed = parseRentcastValue(
    { price: 431000, priceRangeLow: 400000, priceRangeHigh: 460000 },
    '418 Oak St, Columbus, OH',
  );
  assert.equal(parsed.estimatedValue, 431000);
  assert.equal(parsed.rangeLow, 400000);
  assert.equal(parsed.rangeHigh, 460000);
  assert.equal(parsed.source, 'RentCast');
  assert.equal(parsed.mock, false);
});
