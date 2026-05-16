-- Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── COUPLES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS couples (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name      text NOT NULL,
  currency  text NOT NULL DEFAULT 'EUR',
  created_at timestamptz DEFAULT now()
);

-- ─── COUPLE MEMBERS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS couple_members (
  couple_id    uuid REFERENCES couples(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_url   text,
  color        text NOT NULL DEFAULT '#e07a5f',
  share_ratio  numeric(4,3) NOT NULL DEFAULT 0.5,
  joined_at    timestamptz DEFAULT now(),
  PRIMARY KEY (couple_id, user_id)
);

-- Trigger: max 2 members per couple
CREATE OR REPLACE FUNCTION check_couple_member_limit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT COUNT(*) FROM couple_members WHERE couple_id = NEW.couple_id) >= 2 THEN
    RAISE EXCEPTION 'Un couple ne peut pas avoir plus de 2 membres.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_couple_limit
  BEFORE INSERT ON couple_members
  FOR EACH ROW EXECUTE FUNCTION check_couple_member_limit();

-- ─── COUPLE INVITES ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS couple_invites (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id  uuid REFERENCES couples(id) ON DELETE CASCADE,
  token      text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at    timestamptz
);

-- ─── CATEGORIES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id   uuid REFERENCES couples(id) ON DELETE CASCADE,
  name        text NOT NULL,
  parent_id   uuid REFERENCES categories(id),
  icon        text NOT NULL DEFAULT 'Tag',
  color       text NOT NULL DEFAULT '#6b7280',
  is_archived bool NOT NULL DEFAULT false,
  sort_order  int NOT NULL DEFAULT 0
);

-- ─── MONTHLY BUDGETS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS monthly_budgets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id   uuid REFERENCES couples(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  month       date NOT NULL,
  amount      numeric(12,2) NOT NULL,
  created_by  uuid REFERENCES auth.users(id),
  created_at  timestamptz DEFAULT now(),
  UNIQUE (couple_id, category_id, month)
);

-- ─── EXPENSES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id   uuid REFERENCES couples(id) ON DELETE CASCADE,
  paid_by     uuid REFERENCES auth.users(id),
  category_id uuid REFERENCES categories(id),
  amount      numeric(12,2) NOT NULL,
  currency    text NOT NULL DEFAULT 'EUR',
  description text NOT NULL,
  spent_at    date NOT NULL,
  receipt_url text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── EXPENSE SHARES ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense_shares (
  expense_id   uuid REFERENCES expenses(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users(id),
  share_amount numeric(12,2) NOT NULL,
  PRIMARY KEY (expense_id, user_id)
);

-- ─── INCOMES ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS incomes (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples(id) ON DELETE CASCADE,
  user_id   uuid REFERENCES auth.users(id),
  amount    numeric(12,2) NOT NULL,
  source    text NOT NULL,
  month     date NOT NULL
);

-- ─── SAVINGS POTS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS savings_pots (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id     uuid REFERENCES couples(id) ON DELETE CASCADE,
  name          text NOT NULL,
  icon          text NOT NULL DEFAULT 'PiggyBank',
  color         text NOT NULL DEFAULT '#10b981',
  target_amount numeric(12,2),
  target_date   date,
  is_shared     bool NOT NULL DEFAULT true,
  owner_user_id uuid REFERENCES auth.users(id),
  is_archived   bool NOT NULL DEFAULT false
);

-- ─── SAVINGS TRANSACTIONS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS savings_transactions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id    uuid REFERENCES couples(id) ON DELETE CASCADE,
  pot_id       uuid REFERENCES savings_pots(id) ON DELETE CASCADE,
  amount       numeric(12,2) NOT NULL,
  type         text NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  source_month date,
  description  text,
  made_by      uuid REFERENCES auth.users(id),
  occurred_at  timestamptz DEFAULT now()
);

-- ─── SETTLEMENTS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settlements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id   uuid REFERENCES couples(id) ON DELETE CASCADE,
  from_user   uuid REFERENCES auth.users(id),
  to_user     uuid REFERENCES auth.users(id),
  amount      numeric(12,2) NOT NULL,
  occurred_at timestamptz DEFAULT now(),
  note        text
);

-- ─── USER PROFILES (public mirror of auth.users) ────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  couple_id    uuid REFERENCES couples(id),
  display_name text,
  avatar_url   text,
  color        text DEFAULT '#e07a5f',
  updated_at   timestamptz DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_couple_members_couple ON couple_members(couple_id);
CREATE INDEX IF NOT EXISTS idx_couple_members_user ON couple_members(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_couple ON categories(couple_id);
CREATE INDEX IF NOT EXISTS idx_monthly_budgets_couple ON monthly_budgets(couple_id);
CREATE INDEX IF NOT EXISTS idx_monthly_budgets_month ON monthly_budgets(month);
CREATE INDEX IF NOT EXISTS idx_monthly_budgets_category ON monthly_budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_couple ON expenses(couple_id);
CREATE INDEX IF NOT EXISTS idx_expenses_spent_at ON expenses(spent_at);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expense_shares_expense ON expense_shares(expense_id);
CREATE INDEX IF NOT EXISTS idx_incomes_couple ON incomes(couple_id);
CREATE INDEX IF NOT EXISTS idx_incomes_month ON incomes(month);
CREATE INDEX IF NOT EXISTS idx_savings_pots_couple ON savings_pots(couple_id);
CREATE INDEX IF NOT EXISTS idx_savings_tx_couple ON savings_transactions(couple_id);
CREATE INDEX IF NOT EXISTS idx_savings_tx_pot ON savings_transactions(pot_id);
CREATE INDEX IF NOT EXISTS idx_settlements_couple ON settlements(couple_id);
CREATE INDEX IF NOT EXISTS idx_profiles_couple ON profiles(couple_id);
