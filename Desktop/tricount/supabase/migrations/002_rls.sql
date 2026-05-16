-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
-- Helper: get the couple_id of the current user
CREATE OR REPLACE FUNCTION get_my_couple_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT couple_id FROM profiles WHERE id = auth.uid()
$$;

-- Enable RLS on all tables
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_pots ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- COUPLES
CREATE POLICY "couples_select" ON couples FOR SELECT
  USING (id = get_my_couple_id());
CREATE POLICY "couples_insert" ON couples FOR INSERT
  WITH CHECK (true);
CREATE POLICY "couples_update" ON couples FOR UPDATE
  USING (id = get_my_couple_id());

-- COUPLE MEMBERS
CREATE POLICY "couple_members_select" ON couple_members FOR SELECT
  USING (couple_id = get_my_couple_id());
CREATE POLICY "couple_members_insert" ON couple_members FOR INSERT
  WITH CHECK (couple_id = get_my_couple_id() OR user_id = auth.uid());
CREATE POLICY "couple_members_update" ON couple_members FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "couple_members_delete" ON couple_members FOR DELETE
  USING (user_id = auth.uid());

-- COUPLE INVITES
CREATE POLICY "invites_select" ON couple_invites FOR SELECT
  USING (couple_id = get_my_couple_id() OR true); -- allow token lookup
CREATE POLICY "invites_insert" ON couple_invites FOR INSERT
  WITH CHECK (couple_id = get_my_couple_id());
CREATE POLICY "invites_update" ON couple_invites FOR UPDATE
  USING (couple_id = get_my_couple_id() OR true);

-- CATEGORIES
CREATE POLICY "categories_select" ON categories FOR SELECT
  USING (couple_id = get_my_couple_id());
CREATE POLICY "categories_insert" ON categories FOR INSERT
  WITH CHECK (couple_id = get_my_couple_id());
CREATE POLICY "categories_update" ON categories FOR UPDATE
  USING (couple_id = get_my_couple_id());
CREATE POLICY "categories_delete" ON categories FOR DELETE
  USING (couple_id = get_my_couple_id());

-- MONTHLY BUDGETS
CREATE POLICY "monthly_budgets_select" ON monthly_budgets FOR SELECT
  USING (couple_id = get_my_couple_id());
CREATE POLICY "monthly_budgets_insert" ON monthly_budgets FOR INSERT
  WITH CHECK (couple_id = get_my_couple_id());
CREATE POLICY "monthly_budgets_update" ON monthly_budgets FOR UPDATE
  USING (couple_id = get_my_couple_id());
CREATE POLICY "monthly_budgets_delete" ON monthly_budgets FOR DELETE
  USING (couple_id = get_my_couple_id());

-- EXPENSES
CREATE POLICY "expenses_select" ON expenses FOR SELECT
  USING (couple_id = get_my_couple_id());
CREATE POLICY "expenses_insert" ON expenses FOR INSERT
  WITH CHECK (couple_id = get_my_couple_id());
CREATE POLICY "expenses_update" ON expenses FOR UPDATE
  USING (couple_id = get_my_couple_id());
CREATE POLICY "expenses_delete" ON expenses FOR DELETE
  USING (couple_id = get_my_couple_id());

-- EXPENSE SHARES
CREATE POLICY "expense_shares_select" ON expense_shares FOR SELECT
  USING (expense_id IN (SELECT id FROM expenses WHERE couple_id = get_my_couple_id()));
CREATE POLICY "expense_shares_insert" ON expense_shares FOR INSERT
  WITH CHECK (expense_id IN (SELECT id FROM expenses WHERE couple_id = get_my_couple_id()));
CREATE POLICY "expense_shares_update" ON expense_shares FOR UPDATE
  USING (expense_id IN (SELECT id FROM expenses WHERE couple_id = get_my_couple_id()));
CREATE POLICY "expense_shares_delete" ON expense_shares FOR DELETE
  USING (expense_id IN (SELECT id FROM expenses WHERE couple_id = get_my_couple_id()));

-- INCOMES
CREATE POLICY "incomes_select" ON incomes FOR SELECT
  USING (couple_id = get_my_couple_id());
CREATE POLICY "incomes_insert" ON incomes FOR INSERT
  WITH CHECK (couple_id = get_my_couple_id());
CREATE POLICY "incomes_update" ON incomes FOR UPDATE
  USING (couple_id = get_my_couple_id());
CREATE POLICY "incomes_delete" ON incomes FOR DELETE
  USING (couple_id = get_my_couple_id());

-- SAVINGS POTS
CREATE POLICY "savings_pots_select" ON savings_pots FOR SELECT
  USING (couple_id = get_my_couple_id());
CREATE POLICY "savings_pots_insert" ON savings_pots FOR INSERT
  WITH CHECK (couple_id = get_my_couple_id());
CREATE POLICY "savings_pots_update" ON savings_pots FOR UPDATE
  USING (couple_id = get_my_couple_id());
CREATE POLICY "savings_pots_delete" ON savings_pots FOR DELETE
  USING (couple_id = get_my_couple_id());

-- SAVINGS TRANSACTIONS
CREATE POLICY "savings_tx_select" ON savings_transactions FOR SELECT
  USING (couple_id = get_my_couple_id());
CREATE POLICY "savings_tx_insert" ON savings_transactions FOR INSERT
  WITH CHECK (couple_id = get_my_couple_id());
CREATE POLICY "savings_tx_update" ON savings_transactions FOR UPDATE
  USING (couple_id = get_my_couple_id());
CREATE POLICY "savings_tx_delete" ON savings_transactions FOR DELETE
  USING (couple_id = get_my_couple_id());

-- SETTLEMENTS
CREATE POLICY "settlements_select" ON settlements FOR SELECT
  USING (couple_id = get_my_couple_id());
CREATE POLICY "settlements_insert" ON settlements FOR INSERT
  WITH CHECK (couple_id = get_my_couple_id());
CREATE POLICY "settlements_delete" ON settlements FOR DELETE
  USING (couple_id = get_my_couple_id());

-- PROFILES
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (id = auth.uid() OR couple_id = get_my_couple_id());
CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (id = auth.uid());
