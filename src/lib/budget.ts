import { currentMonthKey, isInMonth } from '@/src/lib/dates';
import { sumBy } from '@/src/lib/money';
import type { Category, FixedExpense, IncomeSource, Transaction } from '@/src/types';

export interface CategoryActual {
  categoryId: string;
  name: string;
  kind: Category['kind'];
  color: string;
  spent: number;
  received: number;
}

export interface BudgetSummary {
  month: string;
  plannedIncome: number;
  plannedFixed: number;
  discretionaryAllowance: number;
  discretionarySpent: number;
  discretionaryRemaining: number;
  actualIncome: number;
  actualFixed: number;
  categoryActuals: CategoryActual[];
}

export function computeBudget(input: {
  incomeSources: IncomeSource[];
  fixedExpenses: FixedExpense[];
  transactions: Transaction[];
  categories: Category[];
  month?: string;
}): BudgetSummary {
  const month = input.month ?? currentMonthKey();
  const plannedIncome = sumBy(input.incomeSources, (item) => item.monthlyAmount);
  const plannedFixed = sumBy(input.fixedExpenses, (item) => item.monthlyAmount);
  const discretionaryAllowance = plannedIncome - plannedFixed;

  const categoriesById = new Map(input.categories.map((category) => [category.id, category]));
  const monthTxns = input.transactions.filter(
    (txn) => isInMonth(txn.date, month) && !txn.isTransfer,
  );

  const buckets = new Map<string, CategoryActual>();
  for (const category of input.categories) {
    if (category.kind === 'transfer') continue;
    buckets.set(category.id, {
      categoryId: category.id,
      name: category.name,
      kind: category.kind,
      color: category.color,
      spent: 0,
      received: 0,
    });
  }

  let actualIncome = 0;
  let actualFixed = 0;
  let discretionarySpent = 0;

  for (const txn of monthTxns) {
    const category = categoriesById.get(txn.categoryId);
    if (!category || category.kind === 'transfer') continue;

    const bucket = buckets.get(category.id);
    if (txn.amount >= 0) {
      if (bucket) bucket.received += txn.amount;
      if (category.kind === 'income') actualIncome += txn.amount;
    } else {
      const spent = Math.abs(txn.amount);
      if (bucket) bucket.spent += spent;
      if (category.kind === 'discretionary') discretionarySpent += spent;
      if (category.kind === 'fixed' || category.kind === 'debt') actualFixed += spent;
    }
  }

  const categoryActuals = [...buckets.values()]
    .filter((bucket) => bucket.spent > 0 || bucket.received > 0)
    .sort((a, b) => b.spent - a.spent || b.received - a.received);

  return {
    month,
    plannedIncome,
    plannedFixed,
    discretionaryAllowance,
    discretionarySpent,
    discretionaryRemaining: discretionaryAllowance - discretionarySpent,
    actualIncome,
    actualFixed,
    categoryActuals,
  };
}

export function applyMerchantRules<T extends { merchant: string; categoryId: string }>(
  transactions: T[],
  rules: { match: string; categoryId: string }[],
): T[] {
  if (rules.length === 0) return transactions;
  return transactions.map((txn) => {
    const merchant = txn.merchant.toLowerCase();
    const rule = rules.find((item) => merchant.includes(item.match.toLowerCase()));
    return rule ? { ...txn, categoryId: rule.categoryId } : txn;
  });
}
