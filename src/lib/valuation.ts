import { helperBaseUrl } from '@/src/lib/helper';
import type { PropertyValuation } from '@/src/types';

export interface ValuationRequest {
  address: string;
}

export function normalizeAddress(address: string): string {
  return address.trim().replace(/\s+/g, ' ');
}

/** Deterministic fixture estimate so demo/real-estate works without an API key. */
export function mockValuation(address: string): PropertyValuation {
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

export function parseRentcastValue(body: Record<string, unknown>, address: string): PropertyValuation {
  const estimatedValue = Number(body.price ?? body.estimatedValue);
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

export async function fetchPropertyValuation(address: string): Promise<PropertyValuation> {
  const queried = normalizeAddress(address);
  if (!queried) {
    throw new Error('Enter a street address (Street, City, State, ZIP).');
  }

  const base = helperBaseUrl();
  if (!base) {
    return mockValuation(queried);
  }

  try {
    const response = await fetch(`${base}/valuations/estimate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ address: queried }),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string; mock?: boolean };
      if (body.mock || response.status === 503) {
        return mockValuation(queried);
      }
      throw new Error(body.error || `Valuation server ${response.status}`);
    }
    return (await response.json()) as PropertyValuation;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Valuation server')) {
      throw error;
    }
    return mockValuation(queried);
  }
}
