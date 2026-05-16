-- ─── RECURRING EXPENSES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recurring_expenses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id       uuid NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  description     text NOT NULL,
  amount          numeric(12,2) NOT NULL CHECK (amount > 0),
  category_id     uuid REFERENCES categories(id) ON DELETE SET NULL,
  paid_by         uuid NOT NULL,
  day_of_month    smallint NOT NULL DEFAULT 1 CHECK (day_of_month BETWEEN 1 AND 28),
  split_mode      text NOT NULL DEFAULT 'equal' CHECK (split_mode IN ('equal', 'payer_only')),
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS recurring_expense_id uuid REFERENCES recurring_expenses(id) ON DELETE SET NULL;

ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recurring_select" ON recurring_expenses FOR SELECT
  USING (couple_id = get_my_couple_id());
CREATE POLICY "recurring_insert" ON recurring_expenses FOR INSERT
  WITH CHECK (couple_id = get_my_couple_id());
CREATE POLICY "recurring_update" ON recurring_expenses FOR UPDATE
  USING (couple_id = get_my_couple_id());
CREATE POLICY "recurring_delete" ON recurring_expenses FOR DELETE
  USING (couple_id = get_my_couple_id());
