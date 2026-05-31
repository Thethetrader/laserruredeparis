-- Migration: CA tracking
-- Add ca_settings column to establishments
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS ca_settings jsonb DEFAULT '{"mode":"disabled","staff_can_enter":false}'::jsonb;

-- Create ca_entries table
CREATE TABLE IF NOT EXISTS ca_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid REFERENCES establishments(id) ON DELETE CASCADE NOT NULL,
  entry_date date NOT NULL,
  service text NOT NULL DEFAULT 'day' CHECK (service IN ('midi', 'soir', 'day', 'month')),
  amount numeric(10,2) NOT NULL DEFAULT 0,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE (establishment_id, entry_date, service)
);

-- RLS
ALTER TABLE ca_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "establishment members can read ca_entries"
  ON ca_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM establishment_members em
      WHERE em.establishment_id = ca_entries.establishment_id
        AND em.profile_id = auth.uid()
        AND em.is_active = true
    )
  );

CREATE POLICY "managers can insert ca_entries"
  ON ca_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM establishment_members em
      WHERE em.establishment_id = ca_entries.establishment_id
        AND em.profile_id = auth.uid()
        AND em.is_active = true
        AND (
          em.role IN ('owner', 'manager')
          OR (
            (SELECT (ca_settings->>'staff_can_enter')::boolean FROM establishments WHERE id = ca_entries.establishment_id) = true
          )
        )
    )
  );

CREATE POLICY "managers can update ca_entries"
  ON ca_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM establishment_members em
      WHERE em.establishment_id = ca_entries.establishment_id
        AND em.profile_id = auth.uid()
        AND em.is_active = true
        AND em.role IN ('owner', 'manager')
    )
  );
