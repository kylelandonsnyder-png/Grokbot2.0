import { categories as seedCategories, merchantRules as seedRules } from '@/src/data/fixtures';
import type { AppSnapshot } from '@/src/types';

export function cloudStarterSnapshot(): AppSnapshot {
  return {
    accounts: [],
    transactions: [],
    categories: seedCategories,
    merchantRules: seedRules,
    incomeSources: [],
    fixedExpenses: [],
    debts: [],
    properties: [],
    retirement: {
      currentAge: 30,
      retirementAge: 65,
      monthlyContribution: 0,
      expectedReturn: 0.07,
      targetNestEgg: 0,
    },
    plaidItems: [],
    settings: {
      hasSeeded: true,
      notificationsEnabled: false,
      seenTransactionIds: [],
    },
  };
}

export function isCloudSnapshotEmpty(snapshot: AppSnapshot): boolean {
  return (
    snapshot.accounts.length === 0 &&
    snapshot.transactions.length === 0 &&
    snapshot.properties.length === 0 &&
    snapshot.incomeSources.length === 0 &&
    snapshot.fixedExpenses.length === 0 &&
    snapshot.categories.length === 0
  );
}
