'use strict';

function hasRentcastKey(apiKey) {
  return Boolean(String(apiKey || '').trim());
}

function normalizeAddress(address) {
  return String(address || '').trim().replace(/\s+/g, ' ');
}

function mockValuation(address) {
  const queried = normalizeAddress(address) || 'Unknown address';
  const hash = [...queried.toLowerCase()].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const estimatedValue = 180000 + (hash % 420) * 1000;
  return {
    estimatedValue,
    rangeLow: Math.round(estimatedValue * 0.92),
    rangeHigh: Math.round(estimatedValue * 1.08),
    source: 'RentCast (mock)',
    fetchedAt: new Date().toISOString(),
    addressQueried: queried,
    mock: true,
  };
}

function parseRentcastValue(body, address) {
  const estimatedValue = Number(body?.price ?? body?.estimatedValue);
  if (!Number.isFinite(estimatedValue) || estimatedValue <= 0) {
    throw new Error('RentCast did not return a usable price');
  }
  const rangeLow = Number(body.priceRangeLow);
  const rangeHigh = Number(body.priceRangeHigh);
  return {
    estimatedValue,
    rangeLow: Number.isFinite(rangeLow) ? rangeLow : undefined,
    rangeHigh: Number.isFinite(rangeHigh) ? rangeHigh : undefined,
    source: 'RentCast',
    fetchedAt: new Date().toISOString(),
    addressQueried: normalizeAddress(address),
    mock: false,
  };
}

async function estimateValue({ address, apiKey, fetchImpl = fetch }) {
  const queried = normalizeAddress(address);
  if (!queried) {
    return { status: 400, body: { error: 'address required' } };
  }
  if (!hasRentcastKey(apiKey)) {
    return { status: 200, body: mockValuation(queried) };
  }

  const url = new URL('https://api.rentcast.io/v1/avm/value');
  url.searchParams.set('address', queried);
  url.searchParams.set('compCount', '5');

  const response = await fetchImpl(url.toString(), {
    headers: {
      Accept: 'application/json',
      'X-Api-Key': apiKey,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      status: response.status,
      body: {
        error: payload.message || payload.error || 'RentCast request failed',
        mock: false,
      },
    };
  }
  return { status: 200, body: parseRentcastValue(payload, queried) };
}

module.exports = {
  hasRentcastKey,
  mockValuation,
  parseRentcastValue,
  estimateValue,
};
