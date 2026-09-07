import { computePortfolioMetrics } from '@/src/lib/realEstate';
import { sumBy } from '@/src/lib/money';
import type { Account, Debt, Property } from '@/src/types';

export function accountGroup(accounts: Account[]) {
  const cash = accounts.filter((account) => account.type === 'checking' || account.type === 'savings');
  const investments = accounts.filter((account) => account.type === 'investment');
  const retirement = accounts.filter((account) => account.type === 'retirement');
  const credit = accounts.filter((account) => account.type === 'credit');
  const loans = accounts.filter((account) => account.type === 'loan');
  return { cash, investments, retirement, credit, loans };
}

export function computeNetWorth(input: {
  accounts: Account[];
  debts: Debt[];
  properties: Property[];
}) {
  const groups = accountGroup(input.accounts);
  const cash = sumBy(groups.cash, (account) => account.balance);
  const investments = sumBy(groups.investments, (account) => account.balance);
  const retirement = sumBy(groups.retirement, (account) => account.balance);
  const creditBalances = sumBy(groups.credit, (account) => Math.abs(Math.min(account.balance, 0)));
  const loanBalances = sumBy(groups.loans, (account) => Math.abs(Math.min(account.balance, 0)));
  const otherDebts = sumBy(input.debts, (debt) => debt.balance);
  const uniqueDebt = Math.max(otherDebts, creditBalances + loanBalances);
  const realEstate = computePortfolioMetrics(input.properties);

  const assets = cash + investments + retirement + realEstate.totalValue;
  const liabilities = uniqueDebt + realEstate.totalMortgage;
  return {
    groups,
    cash,
    investments,
    retirement,
    otherDebts: uniqueDebt,
    realEstateValue: realEstate.totalValue,
    realEstateEquity: realEstate.totalEquity,
    realEstateMortgage: realEstate.totalMortgage,
    assets,
    liabilities,
    netWorth: assets - liabilities,
  };
}
