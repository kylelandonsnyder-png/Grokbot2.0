import { cloudStarterSnapshot, isCloudSnapshotEmpty } from '@/src/lib/cloudSnapshot';
import { getSupabase } from '@/src/lib/supabase';
import type {
  Account,
  AppSnapshot,
  AppSettings,
  Category,
  Debt,
  FixedExpense,
  IncomeSource,
  MerchantRule,
  PlaidConnection,
  Property,
  PropertyValuation,
  RetirementAssumptions,
  Transaction,
} from '@/src/types';

export { cloudStarterSnapshot, isCloudSnapshotEmpty };

function requireClient() {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

async function replaceRows(
  table: string,
  userId: string,
  rows: Record<string, unknown>[],
) {
  const supabase = requireClient();
  const { error: delError } = await supabase.from(table).delete().eq('user_id', userId);
  if (delError) throw delError;
  if (rows.length === 0) return;
  const { error } = await supabase.from(table).insert(rows);
  if (error) throw error;
}

function accountRow(userId: string, item: Account) {
  return {
    id: item.id,
    user_id: userId,
    name: item.name,
    institution: item.institution,
    type: item.type,
    subtype: item.subtype ?? null,
    balance: item.balance,
    available: item.available ?? null,
    mask: item.mask ?? null,
    plaid_account_id: item.plaidAccountId ?? null,
    plaid_item_id: item.plaidItemId ?? null,
  };
}

function accountFromRow(row: Record<string, unknown>): Account {
  return {
    id: String(row.id),
    name: String(row.name),
    institution: String(row.institution),
    type: row.type as Account['type'],
    subtype: (row.subtype as string) || undefined,
    balance: Number(row.balance),
    available: row.available == null ? undefined : Number(row.available),
    mask: (row.mask as string) || undefined,
    plaidAccountId: (row.plaid_account_id as string) || undefined,
    plaidItemId: (row.plaid_item_id as string) || undefined,
  };
}

function transactionRow(userId: string, item: Transaction) {
  return {
    id: item.id,
    user_id: userId,
    account_id: item.accountId,
    date: item.date,
    merchant: item.merchant,
    amount: item.amount,
    category_id: item.categoryId,
    pending: item.pending,
    is_transfer: item.isTransfer,
    notes: item.notes ?? null,
    plaid_transaction_id: item.plaidTransactionId ?? null,
  };
}

function transactionFromRow(row: Record<string, unknown>): Transaction {
  return {
    id: String(row.id),
    accountId: String(row.account_id),
    date: String(row.date),
    merchant: String(row.merchant),
    amount: Number(row.amount),
    categoryId: String(row.category_id),
    pending: Boolean(row.pending),
    isTransfer: Boolean(row.is_transfer),
    notes: (row.notes as string) || undefined,
    plaidTransactionId: (row.plaid_transaction_id as string) || undefined,
  };
}

function propertyRow(userId: string, item: Property) {
  return {
    id: item.id,
    user_id: userId,
    name: item.name,
    address: item.address,
    occupancy: item.occupancy,
    market_value: item.marketValue,
    mortgage_balance: item.mortgageBalance,
    mortgage_rate: item.mortgageRate ?? null,
    monthly_mortgage_payment: item.monthlyMortgagePayment,
    monthly_rent: item.monthlyRent,
    monthly_expenses: item.monthlyExpenses,
    vacancy_rate: item.vacancyRate,
    purchase_price: item.purchasePrice,
    purchase_date: item.purchaseDate ?? null,
    units: item.units,
    tenants: item.tenants,
    last_estimate: item.lastEstimate ?? null,
  };
}

function propertyFromRow(row: Record<string, unknown>): Property {
  return {
    id: String(row.id),
    name: String(row.name),
    address: String(row.address),
    occupancy: row.occupancy as Property['occupancy'],
    marketValue: Number(row.market_value),
    mortgageBalance: Number(row.mortgage_balance),
    mortgageRate: row.mortgage_rate == null ? undefined : Number(row.mortgage_rate),
    monthlyMortgagePayment: Number(row.monthly_mortgage_payment),
    monthlyRent: Number(row.monthly_rent),
    monthlyExpenses: Number(row.monthly_expenses),
    vacancyRate: Number(row.vacancy_rate),
    purchasePrice: Number(row.purchase_price),
    purchaseDate: (row.purchase_date as string) || undefined,
    units: Number(row.units),
    tenants: Array.isArray(row.tenants) ? (row.tenants as Property['tenants']) : [],
    lastEstimate: (row.last_estimate as PropertyValuation) || undefined,
  };
}

export async function pullCloudSnapshot(userId: string): Promise<AppSnapshot> {
  const supabase = requireClient();
  const tables = [
    'categories',
    'merchant_rules',
    'accounts',
    'transactions',
    'income_sources',
    'fixed_expenses',
    'debts',
    'properties',
    'plaid_items',
  ] as const;

  const results: Record<string, Record<string, unknown>[]> = {};
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').eq('user_id', userId);
    if (error) throw error;
    results[table] = (data ?? []) as Record<string, unknown>[];
  }

  const { data: retirementRow, error: retirementError } = await supabase
    .from('retirement_assumptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (retirementError) throw retirementError;

  const { data: settingsRow, error: settingsError } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (settingsError) throw settingsError;

  const retirement: RetirementAssumptions = retirementRow
    ? {
        currentAge: Number(retirementRow.current_age),
        retirementAge: Number(retirementRow.retirement_age),
        monthlyContribution: Number(retirementRow.monthly_contribution),
        expectedReturn: Number(retirementRow.expected_return),
        targetNestEgg: Number(retirementRow.target_nest_egg),
      }
    : cloudStarterSnapshot().retirement;

  const settings: AppSettings = settingsRow
    ? {
        hasSeeded: Boolean(settingsRow.has_seeded),
        notificationsEnabled: Boolean(settingsRow.notifications_enabled),
        seenTransactionIds: Array.isArray(settingsRow.seen_transaction_ids)
          ? (settingsRow.seen_transaction_ids as string[])
          : [],
      }
    : cloudStarterSnapshot().settings;

  return {
    categories: results.categories.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      kind: row.kind as Category['kind'],
      icon: String(row.icon ?? ''),
      color: String(row.color ?? ''),
    })),
    merchantRules: results.merchant_rules.map((row) => ({
      id: String(row.id),
      match: String(row.match),
      categoryId: String(row.category_id),
    })),
    accounts: results.accounts.map(accountFromRow),
    transactions: results.transactions.map(transactionFromRow),
    incomeSources: results.income_sources.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      monthlyAmount: Number(row.monthly_amount),
    })),
    fixedExpenses: results.fixed_expenses.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      monthlyAmount: Number(row.monthly_amount),
      categoryId: (row.category_id as string) || undefined,
    })),
    debts: results.debts.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      kind: row.kind as Debt['kind'],
      balance: Number(row.balance),
      interestRate: row.interest_rate == null ? undefined : Number(row.interest_rate),
      minimumPayment: row.minimum_payment == null ? undefined : Number(row.minimum_payment),
      accountId: (row.account_id as string) || undefined,
    })),
    properties: results.properties.map(propertyFromRow),
    retirement,
    plaidItems: results.plaid_items.map((row) => ({
      id: String(row.id),
      institutionName: String(row.institution_name),
      itemId: String(row.item_id),
      products: Array.isArray(row.products) ? (row.products as string[]) : [],
      connectedAt: String(row.connected_at),
      source: row.source === 'plaid' ? 'plaid' : 'mock',
    })),
    settings,
  };
}

export async function pushCloudSnapshot(userId: string, snapshot: AppSnapshot): Promise<void> {
  await replaceRows(
    'categories',
    userId,
    snapshot.categories.map((item: Category) => ({
      id: item.id,
      user_id: userId,
      name: item.name,
      kind: item.kind,
      icon: item.icon,
      color: item.color,
    })),
  );
  await replaceRows(
    'merchant_rules',
    userId,
    snapshot.merchantRules.map((item: MerchantRule) => ({
      id: item.id,
      user_id: userId,
      match: item.match,
      category_id: item.categoryId,
    })),
  );
  await replaceRows('accounts', userId, snapshot.accounts.map((item) => accountRow(userId, item)));
  await replaceRows(
    'transactions',
    userId,
    snapshot.transactions.map((item) => transactionRow(userId, item)),
  );
  await replaceRows(
    'income_sources',
    userId,
    snapshot.incomeSources.map((item: IncomeSource) => ({
      id: item.id,
      user_id: userId,
      name: item.name,
      monthly_amount: item.monthlyAmount,
    })),
  );
  await replaceRows(
    'fixed_expenses',
    userId,
    snapshot.fixedExpenses.map((item: FixedExpense) => ({
      id: item.id,
      user_id: userId,
      name: item.name,
      monthly_amount: item.monthlyAmount,
      category_id: item.categoryId ?? null,
    })),
  );
  await replaceRows(
    'debts',
    userId,
    snapshot.debts.map((item: Debt) => ({
      id: item.id,
      user_id: userId,
      name: item.name,
      kind: item.kind,
      balance: item.balance,
      interest_rate: item.interestRate ?? null,
      minimum_payment: item.minimumPayment ?? null,
      account_id: item.accountId ?? null,
    })),
  );
  await replaceRows(
    'properties',
    userId,
    snapshot.properties.map((item) => propertyRow(userId, item)),
  );
  await replaceRows(
    'plaid_items',
    userId,
    snapshot.plaidItems.map((item: PlaidConnection) => ({
      id: item.id,
      user_id: userId,
      institution_name: item.institutionName,
      item_id: item.itemId,
      products: item.products,
      connected_at: item.connectedAt,
      source: item.source,
    })),
  );

  const supabase = requireClient();
  const { error: retirementError } = await supabase.from('retirement_assumptions').upsert({
    user_id: userId,
    current_age: snapshot.retirement.currentAge,
    retirement_age: snapshot.retirement.retirementAge,
    monthly_contribution: snapshot.retirement.monthlyContribution,
    expected_return: snapshot.retirement.expectedReturn,
    target_nest_egg: snapshot.retirement.targetNestEgg,
  });
  if (retirementError) throw retirementError;

  const { error: settingsError } = await supabase.from('user_settings').upsert({
    user_id: userId,
    has_seeded: snapshot.settings.hasSeeded,
    notifications_enabled: snapshot.settings.notificationsEnabled,
    seen_transaction_ids: snapshot.settings.seenTransactionIds,
  });
  if (settingsError) throw settingsError;

  const valuationRows = snapshot.properties
    .filter((property) => property.lastEstimate)
    .map((property) => ({
      user_id: userId,
      property_id: property.id,
      estimated_value: property.lastEstimate!.estimatedValue,
      range_low: property.lastEstimate!.rangeLow ?? null,
      range_high: property.lastEstimate!.rangeHigh ?? null,
      source: property.lastEstimate!.source,
      fetched_at: property.lastEstimate!.fetchedAt,
      address_queried: property.lastEstimate!.addressQueried,
      mock: property.lastEstimate!.mock,
    }));
  const { error: valDelError } = await supabase.from('property_valuations').delete().eq('user_id', userId);
  if (valDelError) throw valDelError;
  if (valuationRows.length > 0) {
    const { error } = await supabase.from('property_valuations').insert(valuationRows);
    if (error) throw error;
  }
}

export async function loadOrInitializeCloud(userId: string): Promise<AppSnapshot> {
  const remote = await pullCloudSnapshot(userId);
  if (isCloudSnapshotEmpty(remote)) {
    const starter = cloudStarterSnapshot();
    await pushCloudSnapshot(userId, starter);
    return starter;
  }
  return remote;
}
