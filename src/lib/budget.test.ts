import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { applyMerchantRules, computeBudget } from '@/src/lib/budget';
import type { Category, Transaction } from '@/src/types';

const categories: Category[] = [
  { id: 'inc', name: 'Pay', kind: 'income', icon: 'x', color: '#000' },
  { id: 'fix', name: 'Rent', kind: 'fixed', icon: 'x', color: '#000' },
  { id: 'food', name: 'Food', kind: 'discretionary', icon: 'x', color: '#000' },
  { id: 'xfer', name: 'Transfer', kind: 'transfer', icon: 'x', color: '#000' },
];

const transactions: Transaction[] = [
  {
    id: '1',
    accountId: 'a',
    date: '2026-09-01',
    merchant: 'Job',
    amount: 5000,
    categoryId: 'inc',
    pending: false,
    isTransfer: false,
  },
  {
    id: '2',
    accountId: 'a',
    date: '2026-09-02',
    merchant: 'Landlord',
    amount: -1800,
    categoryId: 'fix',
    pending: false,
    isTransfer: false,
  },
  {
    id: '3',
    accountId: 'a',
    date: '2026-09-03',
    merchant: 'Kroger',
    amount: -200,
    categoryId: 'food',
    pending: false,
    isTransfer: false,
  },
  {
    id: '4',
    accountId: 'a',
    date: '2026-09-04',
    merchant: 'Amex payment',
    amount: -900,
    categoryId: 'xfer',
    pending: false,
    isTransfer: true,
  },
];

describe('computeBudget', () => {
  it('uses income minus fixed for discretionary leftover', () => {
    const summary = computeBudget({
      incomeSources: [{ id: 'i', name: 'Job', monthlyAmount: 5000 }],
      fixedExpenses: [{ id: 'f', name: 'Rent', monthlyAmount: 1800 }],
      transactions,
      categories,
      month: '2026-09',
    });

    assert.equal(summary.plannedIncome, 5000);
    assert.equal(summary.plannedFixed, 1800);
    assert.equal(summary.discretionaryAllowance, 3200);
    assert.equal(summary.discretionarySpent, 200);
    assert.equal(summary.discretionaryRemaining, 3000);
    assert.equal(summary.actualIncome, 5000);
    assert.equal(summary.actualFixed, 1800);
  });

  it('does not let transfers inflate spend', () => {
    const summary = computeBudget({
      incomeSources: [{ id: 'i', name: 'Job', monthlyAmount: 5000 }],
      fixedExpenses: [{ id: 'f', name: 'Rent', monthlyAmount: 1800 }],
      transactions,
      categories,
      month: '2026-09',
    });

    const transferBucket = summary.categoryActuals.find((row) => row.categoryId === 'xfer');
    assert.equal(transferBucket, undefined);
    assert.equal(
      summary.categoryActuals.reduce((total, row) => total + row.spent, 0),
      2000,
    );
  });
});

describe('applyMerchantRules', () => {
  it('recategorizes matching merchants', () => {
    const [updated] = applyMerchantRules(
      [{ merchant: 'KROGER #123', categoryId: 'inc' }],
      [{ match: 'kroger', categoryId: 'food' }],
    );
    assert.equal(updated.categoryId, 'food');
  });
});
