'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { hasRentcastKey, mockValuation, parseRentcastValue, estimateValue } = require('./valuation');

test('missing RentCast key is mock mode', () => {
  assert.equal(hasRentcastKey(''), false);
  assert.equal(hasRentcastKey('  '), false);
  assert.equal(hasRentcastKey('rc_live_xxx'), true);
});

test('estimateValue returns mock when no key — demo still works', async () => {
  const result = await estimateValue({ address: '418 Oak St, Columbus, OH', apiKey: '' });
  assert.equal(result.status, 200);
  assert.equal(result.body.mock, true);
  assert.equal(result.body.source, 'RentCast (mock)');
  assert.ok(result.body.estimatedValue > 0);
});

test('estimateValue requires an address', async () => {
  const result = await estimateValue({ address: '  ', apiKey: '' });
  assert.equal(result.status, 400);
});

test('parseRentcastValue rejects empty payloads', () => {
  assert.throws(() => parseRentcastValue({}, 'x'));
});

test('live key is forwarded to RentCast and never echoed', async () => {
  const result = await estimateValue({
    address: '5500 Grand Lake Dr, San Antonio, TX, 78244',
    apiKey: 'secret-key',
    fetchImpl: async (url, init) => {
      assert.match(String(url), /api\.rentcast\.io\/v1\/avm\/value/);
      assert.equal(init.headers['X-Api-Key'], 'secret-key');
      return {
        ok: true,
        json: async () => ({ price: 350000, priceRangeLow: 330000, priceRangeHigh: 370000 }),
      };
    },
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.estimatedValue, 350000);
  assert.equal(result.body.mock, false);
  assert.equal(JSON.stringify(result.body).includes('secret-key'), false);
});
