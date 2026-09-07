import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { computePropertyMetrics } from '@/src/lib/realEstate';
import type { Property } from '@/src/types';

const rental: Property = {
  id: 'p',
  name: 'Duplex',
  address: '1 Main',
  occupancy: 'rental',
  marketValue: 400000,
  mortgageBalance: 250000,
  monthlyMortgagePayment: 1600,
  monthlyRent: 3000,
  monthlyExpenses: 800,
  vacancyRate: 0.1,
  purchasePrice: 300000,
  units: 2,
  tenants: [
    {
      id: 't1',
      name: 'Ada',
      monthlyRent: 1500,
      status: 'current',
    },
    {
      id: 't2',
      name: 'Vacant',
      monthlyRent: 0,
      status: 'vacant',
    },
  ],
};

describe('computePropertyMetrics', () => {
  it('applies vacancy, profit, ROI, and monthly return', () => {
    const metrics = computePropertyMetrics(rental);
    assert.equal(metrics.equity, 150000);
    assert.equal(metrics.vacancyLoss, 300);
    assert.equal(metrics.effectiveRent, 2700);
    assert.equal(metrics.noi, 1900);
    assert.equal(metrics.monthlyProfit, 300);
    assert.equal(metrics.annualCashFlow, 3600);
    assert.equal(metrics.monthlyReturn, 300 / 400000);
    assert.equal(metrics.roiOnEquity, 3600 / 150000);
    assert.equal(metrics.occupiedUnits, 1);
    assert.equal(metrics.vacantUnits, 1);
  });
});
