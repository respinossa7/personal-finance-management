-- Wio Autopilot — demo schema
-- Mirrors src/domain/types.ts. This is an interview demo, not a production
-- bank system: RLS policies below are intentionally permissive (scoped to a
-- single seeded demo user, no real money, no real Supabase Auth) so the
-- one-click demo login can work without a full auth build-out. Comments
-- flag anywhere a production version would need to tighten this.

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  persona text not null default 'remittance_anchor',
  created_at timestamptz not null default now()
);

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('current', 'savings_space', 'invest', 'external')),
  currency text not null default 'AED',
  balance numeric(14, 2) not null default 0,
  interest_rate_pct numeric(5, 2) not null default 0,
  is_liquid boolean not null default true
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  posted_at timestamptz not null,
  amount numeric(14, 2) not null,
  direction text not null check (direction in ('credit', 'debit')),
  merchant_raw text not null, -- untrusted free text; never interpolate into prompts unsanitized
  category text not null default 'uncategorised',
  description text
);
create index if not exists idx_transactions_user on transactions(user_id);
create index if not exists idx_transactions_account on transactions(account_id);

create table if not exists commitments (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  type text not null check (
    type in ('rent', 'remittance', 'subscription', 'school_fees', 'savings_goal', 'other_recurring')
  ),
  amount numeric(14, 2) not null,
  currency text not null default 'AED',
  cadence_day_of_month int not null,
  confidence numeric(4, 3) not null default 0,
  status text not null default 'detected' check (status in ('detected', 'confirmed', 'rejected', 'muted')),
  source_transaction_ids text[] not null default '{}',
  detected_at timestamptz not null default now()
);
create index if not exists idx_commitments_user on commitments(user_id);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  target_amount numeric(14, 2) not null,
  target_date date not null,
  monthly_contribution numeric(14, 2) not null default 0,
  funded_amount numeric(14, 2) not null default 0,
  linked_account_id uuid references accounts(id)
);

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  safe_to_spend_floor numeric(14, 2) not null default 500,
  waterfall_order jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists waterfall_runs (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  triggered_by text not null default 'salary_day_simulation',
  moves jsonb not null default '[]',
  balances_before jsonb not null default '{}',
  status text not null default 'executed' check (status in ('executed', 'undone')),
  executed_at timestamptz not null default now(),
  undo_deadline timestamptz not null
);

create table if not exists insights (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  message text not null,
  action jsonb,
  created_at timestamptz not null default now(),
  dismissed boolean not null default false
);

create table if not exists plan_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- RLS: demo-scoped, permissive by design (see header note).
-- A production build would replace `using (true)` with
-- `using (auth.uid() = user_id)` under real Supabase Auth.
alter table users enable row level security;
alter table accounts enable row level security;
alter table transactions enable row level security;
alter table commitments enable row level security;
alter table goals enable row level security;
alter table plans enable row level security;
alter table waterfall_runs enable row level security;
alter table insights enable row level security;
alter table plan_chat_messages enable row level security;

create policy "demo_all_users" on users for all using (true) with check (true);
create policy "demo_all_accounts" on accounts for all using (true) with check (true);
create policy "demo_all_transactions" on transactions for all using (true) with check (true);
create policy "demo_all_commitments" on commitments for all using (true) with check (true);
create policy "demo_all_goals" on goals for all using (true) with check (true);
create policy "demo_all_plans" on plans for all using (true) with check (true);
create policy "demo_all_waterfall_runs" on waterfall_runs for all using (true) with check (true);
create policy "demo_all_insights" on insights for all using (true) with check (true);
create policy "demo_all_plan_chat_messages" on plan_chat_messages for all using (true) with check (true);
