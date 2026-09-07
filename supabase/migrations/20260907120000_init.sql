-- Grokbot user-owned finance data.
-- Paste into the Supabase SQL editor, or run via the Supabase CLI.
-- RLS: every row is scoped to auth.uid(). Never put service-role keys in the app.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  kind text not null,
  icon text,
  color text,
  primary key (user_id, id)
);

create table if not exists public.merchant_rules (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  match text not null,
  category_id text not null,
  primary key (user_id, id)
);

create table if not exists public.accounts (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  institution text not null,
  type text not null,
  subtype text,
  balance numeric not null default 0,
  available numeric,
  mask text,
  plaid_account_id text,
  plaid_item_id text,
  primary key (user_id, id)
);

create table if not exists public.transactions (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  account_id text not null,
  date text not null,
  merchant text not null,
  amount numeric not null,
  category_id text not null,
  pending boolean not null default false,
  is_transfer boolean not null default false,
  notes text,
  plaid_transaction_id text,
  primary key (user_id, id)
);

create table if not exists public.income_sources (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  monthly_amount numeric not null default 0,
  primary key (user_id, id)
);

create table if not exists public.fixed_expenses (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  monthly_amount numeric not null default 0,
  category_id text,
  primary key (user_id, id)
);

create table if not exists public.debts (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  kind text not null,
  balance numeric not null default 0,
  interest_rate numeric,
  minimum_payment numeric,
  account_id text,
  primary key (user_id, id)
);

create table if not exists public.properties (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  address text not null default '',
  occupancy text not null,
  market_value numeric not null default 0,
  mortgage_balance numeric not null default 0,
  mortgage_rate numeric,
  monthly_mortgage_payment numeric not null default 0,
  monthly_rent numeric not null default 0,
  monthly_expenses numeric not null default 0,
  vacancy_rate numeric not null default 0,
  purchase_price numeric not null default 0,
  purchase_date text,
  units integer not null default 1,
  tenants jsonb not null default '[]'::jsonb,
  last_estimate jsonb,
  primary key (user_id, id)
);

create table if not exists public.property_valuations (
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id text not null,
  estimated_value numeric not null,
  range_low numeric,
  range_high numeric,
  source text not null,
  fetched_at timestamptz not null default now(),
  address_queried text not null,
  mock boolean not null default false,
  primary key (user_id, property_id)
);

create table if not exists public.plaid_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  institution_name text not null,
  item_id text not null,
  products jsonb not null default '[]'::jsonb,
  connected_at timestamptz not null default now(),
  source text not null default 'mock',
  primary key (user_id, id)
);

create table if not exists public.retirement_assumptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_age numeric not null default 30,
  retirement_age numeric not null default 65,
  monthly_contribution numeric not null default 0,
  expected_return numeric not null default 0.07,
  target_nest_egg numeric not null default 0
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  has_seeded boolean not null default true,
  notifications_enabled boolean not null default false,
  seen_transaction_ids jsonb not null default '[]'::jsonb
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.merchant_rules enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.income_sources enable row level security;
alter table public.fixed_expenses enable row level security;
alter table public.debts enable row level security;
alter table public.properties enable row level security;
alter table public.property_valuations enable row level security;
alter table public.plaid_items enable row level security;
alter table public.retirement_assumptions enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "profiles_own" on public.profiles;
drop policy if exists "categories_own" on public.categories;
drop policy if exists "merchant_rules_own" on public.merchant_rules;
drop policy if exists "accounts_own" on public.accounts;
drop policy if exists "transactions_own" on public.transactions;
drop policy if exists "income_sources_own" on public.income_sources;
drop policy if exists "fixed_expenses_own" on public.fixed_expenses;
drop policy if exists "debts_own" on public.debts;
drop policy if exists "properties_own" on public.properties;
drop policy if exists "property_valuations_own" on public.property_valuations;
drop policy if exists "plaid_items_own" on public.plaid_items;
drop policy if exists "retirement_assumptions_own" on public.retirement_assumptions;
drop policy if exists "user_settings_own" on public.user_settings;

create policy "profiles_own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "categories_own" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "merchant_rules_own" on public.merchant_rules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "accounts_own" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "transactions_own" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "income_sources_own" on public.income_sources
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "fixed_expenses_own" on public.fixed_expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "debts_own" on public.debts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "properties_own" on public.properties
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "property_valuations_own" on public.property_valuations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "plaid_items_own" on public.plaid_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "retirement_assumptions_own" on public.retirement_assumptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_settings_own" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
