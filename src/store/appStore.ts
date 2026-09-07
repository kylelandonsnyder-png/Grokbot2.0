import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  accounts as seedAccounts,
  buildDemoTransactions,
  categories as seedCategories,
  debts as seedDebts,
  demoPlaidItems,
  fixedExpenses as seedFixed,
  incomeSources as seedIncome,
  merchantRules as seedRules,
  properties as seedProperties,
  retirement as seedRetirement,
} from '@/src/data/fixtures';
import { applyMerchantRules } from '@/src/lib/budget';
import { createId } from '@/src/lib/ids';
import { notifyNewTransactions } from '@/src/lib/notifications';
import type {
  Account,
  AppSettings,
  Category,
  Debt,
  FixedExpense,
  IncomeSource,
  MerchantRule,
  PlaidConnection,
  Property,
  RetirementAssumptions,
  Tenant,
  Transaction,
} from '@/src/types';

interface AppState {
  hydrated: boolean;
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  merchantRules: MerchantRule[];
  incomeSources: IncomeSource[];
  fixedExpenses: FixedExpense[];
  debts: Debt[];
  properties: Property[];
  retirement: RetirementAssumptions;
  plaidItems: PlaidConnection[];
  settings: AppSettings;
  setHydrated: (value: boolean) => void;
  resetToDemo: () => void;
  addIncomeSource: (name: string, monthlyAmount: number) => void;
  updateIncomeSource: (id: string, patch: Partial<IncomeSource>) => void;
  removeIncomeSource: (id: string) => void;
  addFixedExpense: (name: string, monthlyAmount: number) => void;
  updateFixedExpense: (id: string, patch: Partial<FixedExpense>) => void;
  removeFixedExpense: (id: string) => void;
  recategorizeTransaction: (id: string, categoryId: string, rememberMerchant?: boolean) => void;
  addMerchantRule: (match: string, categoryId: string) => void;
  removeMerchantRule: (id: string) => void;
  upsertProperty: (property: Property) => void;
  removeProperty: (id: string) => void;
  upsertTenant: (propertyId: string, tenant: Tenant) => void;
  removeTenant: (propertyId: string, tenantId: string) => void;
  updateRetirement: (patch: Partial<RetirementAssumptions>) => void;
  upsertDebt: (debt: Debt) => void;
  removeDebt: (id: string) => void;
  connectMockInstitution: (item: PlaidConnection) => void;
  ingestPlaidSnapshot: (input: {
    item: PlaidConnection;
    accounts: Account[];
    transactions: Transaction[];
  }) => Promise<number>;
  markTransactionsSeen: () => void;
  setNotificationsEnabled: (enabled: boolean) => void;
}

const emptySettings: AppSettings = {
  hasSeeded: false,
  notificationsEnabled: false,
  seenTransactionIds: [],
};

function seedState() {
  const transactions = applyMerchantRules(buildDemoTransactions(), seedRules);
  return {
    accounts: seedAccounts,
    transactions,
    categories: seedCategories,
    merchantRules: seedRules,
    incomeSources: seedIncome,
    fixedExpenses: seedFixed,
    debts: seedDebts,
    properties: seedProperties,
    retirement: seedRetirement,
    plaidItems: demoPlaidItems,
    settings: {
      hasSeeded: true,
      notificationsEnabled: false,
      seenTransactionIds: transactions.map((txn) => txn.id),
    },
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ...seedState(),
      setHydrated: (value) => set({ hydrated: value }),
      resetToDemo: () => set(seedState()),
      addIncomeSource: (name, monthlyAmount) =>
        set({
          incomeSources: [
            ...get().incomeSources,
            { id: createId('inc'), name, monthlyAmount },
          ],
        }),
      updateIncomeSource: (id, patch) =>
        set({
          incomeSources: get().incomeSources.map((item) =>
            item.id === id ? { ...item, ...patch } : item,
          ),
        }),
      removeIncomeSource: (id) =>
        set({ incomeSources: get().incomeSources.filter((item) => item.id !== id) }),
      addFixedExpense: (name, monthlyAmount) =>
        set({
          fixedExpenses: [
            ...get().fixedExpenses,
            { id: createId('fix'), name, monthlyAmount },
          ],
        }),
      updateFixedExpense: (id, patch) =>
        set({
          fixedExpenses: get().fixedExpenses.map((item) =>
            item.id === id ? { ...item, ...patch } : item,
          ),
        }),
      removeFixedExpense: (id) =>
        set({ fixedExpenses: get().fixedExpenses.filter((item) => item.id !== id) }),
      recategorizeTransaction: (id, categoryId, rememberMerchant = false) => {
        const txn = get().transactions.find((item) => item.id === id);
        const category = get().categories.find((item) => item.id === categoryId);
        if (!txn || !category) return;
        const isTransfer = category.kind === 'transfer';
        set({
          transactions: get().transactions.map((item) =>
            item.id === id ? { ...item, categoryId, isTransfer } : item,
          ),
        });
        if (rememberMerchant) {
          get().addMerchantRule(txn.merchant, categoryId);
        }
      },
      addMerchantRule: (match, categoryId) => {
        const normalized = match.trim();
        if (!normalized) return;
        const existing = get().merchantRules.find(
          (rule) => rule.match.toLowerCase() === normalized.toLowerCase(),
        );
        const rules = existing
          ? get().merchantRules.map((rule) =>
              rule.id === existing.id ? { ...rule, categoryId } : rule,
            )
          : [...get().merchantRules, { id: createId('rule'), match: normalized, categoryId }];
        set({
          merchantRules: rules,
          transactions: applyMerchantRules(get().transactions, rules),
        });
      },
      removeMerchantRule: (id) =>
        set({ merchantRules: get().merchantRules.filter((rule) => rule.id !== id) }),
      upsertProperty: (property) => {
        const exists = get().properties.some((item) => item.id === property.id);
        set({
          properties: exists
            ? get().properties.map((item) => (item.id === property.id ? property : item))
            : [...get().properties, property],
        });
      },
      removeProperty: (id) =>
        set({ properties: get().properties.filter((item) => item.id !== id) }),
      upsertTenant: (propertyId, tenant) =>
        set({
          properties: get().properties.map((property) => {
            if (property.id !== propertyId) return property;
            const exists = property.tenants.some((item) => item.id === tenant.id);
            return {
              ...property,
              tenants: exists
                ? property.tenants.map((item) => (item.id === tenant.id ? tenant : item))
                : [...property.tenants, tenant],
            };
          }),
        }),
      removeTenant: (propertyId, tenantId) =>
        set({
          properties: get().properties.map((property) =>
            property.id === propertyId
              ? { ...property, tenants: property.tenants.filter((item) => item.id !== tenantId) }
              : property,
          ),
        }),
      updateRetirement: (patch) => set({ retirement: { ...get().retirement, ...patch } }),
      upsertDebt: (debt) => {
        const exists = get().debts.some((item) => item.id === debt.id);
        set({
          debts: exists
            ? get().debts.map((item) => (item.id === debt.id ? debt : item))
            : [...get().debts, debt],
        });
      },
      removeDebt: (id) => set({ debts: get().debts.filter((item) => item.id !== id) }),
      connectMockInstitution: (item) => {
        if (get().plaidItems.some((existing) => existing.id === item.id)) return;
        set({ plaidItems: [...get().plaidItems, item] });
      },
      ingestPlaidSnapshot: async ({ item, accounts, transactions }) => {
        const rules = get().merchantRules;
        const incoming = applyMerchantRules(transactions, rules);
        const existingIds = new Set(get().transactions.map((txn) => txn.id));
        const fresh = incoming.filter((txn) => !existingIds.has(txn.id));
        const mergedAccounts = mergeById(get().accounts, accounts);
        const mergedTxns = mergeById(get().transactions, incoming);
        const items = get().plaidItems.some((existing) => existing.id === item.id)
          ? get().plaidItems.map((existing) => (existing.id === item.id ? item : existing))
          : [...get().plaidItems, item];
        set({
          accounts: mergedAccounts,
          transactions: mergedTxns,
          plaidItems: items,
        });
        if (get().settings.notificationsEnabled && fresh.length > 0) {
          await notifyNewTransactions(fresh.length);
        }
        return fresh.length;
      },
      markTransactionsSeen: () =>
        set({
          settings: {
            ...get().settings,
            seenTransactionIds: get().transactions.map((txn) => txn.id),
          },
        }),
      setNotificationsEnabled: (enabled) =>
        set({ settings: { ...get().settings, notificationsEnabled: enabled } }),
    }),
    {
      name: 'grokbot-local-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        accounts: state.accounts,
        transactions: state.transactions,
        categories: state.categories,
        merchantRules: state.merchantRules,
        incomeSources: state.incomeSources,
        fixedExpenses: state.fixedExpenses,
        debts: state.debts,
        properties: state.properties,
        retirement: state.retirement,
        plaidItems: state.plaidItems,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && !state.settings.hasSeeded) {
          state.resetToDemo();
        }
        state?.setHydrated(true);
      },
    },
  ),
);

function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const map = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) {
    map.set(item.id, { ...map.get(item.id), ...item });
  }
  return [...map.values()];
}
