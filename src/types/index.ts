export type CategoryKind =
  | 'income'
  | 'fixed'
  | 'discretionary'
  | 'transfer'
  | 'debt';

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  icon: string;
  color: string;
}

export type AccountType =
  | 'checking'
  | 'savings'
  | 'credit'
  | 'loan'
  | 'investment'
  | 'retirement'
  | 'other';

export interface Account {
  id: string;
  name: string;
  institution: string;
  type: AccountType;
  subtype?: string;
  balance: number;
  available?: number;
  mask?: string;
  plaidAccountId?: string;
  plaidItemId?: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  date: string;
  merchant: string;
  amount: number;
  categoryId: string;
  pending: boolean;
  isTransfer: boolean;
  notes?: string;
  plaidTransactionId?: string;
}

export interface MerchantRule {
  id: string;
  match: string;
  categoryId: string;
}

export interface IncomeSource {
  id: string;
  name: string;
  monthlyAmount: number;
}

export interface FixedExpense {
  id: string;
  name: string;
  monthlyAmount: number;
  categoryId?: string;
}

export type DebtKind = 'credit_card' | 'auto' | 'student' | 'personal' | 'other';

export interface Debt {
  id: string;
  name: string;
  kind: DebtKind;
  balance: number;
  interestRate?: number;
  minimumPayment?: number;
  accountId?: string;
}

export interface Tenant {
  id: string;
  name: string;
  unit?: string;
  leaseStart?: string;
  leaseEnd?: string;
  monthlyRent: number;
  email?: string;
  phone?: string;
  status: 'current' | 'notice' | 'vacant';
}

export interface PropertyValuation {
  estimatedValue: number;
  rangeLow?: number;
  rangeHigh?: number;
  source: string;
  fetchedAt: string;
  addressQueried: string;
  mock: boolean;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  occupancy: 'rental' | 'owner';
  marketValue: number;
  mortgageBalance: number;
  mortgageRate?: number;
  monthlyMortgagePayment: number;
  monthlyRent: number;
  monthlyExpenses: number;
  vacancyRate: number;
  purchasePrice: number;
  purchaseDate?: string;
  units: number;
  tenants: Tenant[];
  lastEstimate?: PropertyValuation;
}

export interface RetirementAssumptions {
  currentAge: number;
  retirementAge: number;
  monthlyContribution: number;
  expectedReturn: number;
  targetNestEgg: number;
}

export interface PlaidConnection {
  id: string;
  institutionName: string;
  itemId: string;
  products: string[];
  connectedAt: string;
  source: 'plaid' | 'mock';
}

export interface AppSettings {
  hasSeeded: boolean;
  notificationsEnabled: boolean;
  seenTransactionIds: string[];
}

export interface AppSnapshot {
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
}
