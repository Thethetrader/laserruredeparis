-- Planning IA

CREATE TABLE IF NOT EXISTS planning_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid REFERENCES establishments(id) ON DELETE CASCADE NOT NULL,
  week_start date NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','validated')),
  service_needs jsonb DEFAULT NULL,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE (establishment_id, week_start)
);

CREATE TABLE IF NOT EXISTS planning_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_week_id uuid REFERENCES planning_weeks(id) ON DELETE CASCADE NOT NULL,
  establishment_id uuid REFERENCES establishments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  shift_date date NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  hours_worked numeric(4,2) NOT NULL DEFAULT 0,
  service text CHECK (service IN ('midi','soir','journee')),
  confirmed_at timestamptz DEFAULT NULL,
  confirmed_by uuid REFERENCES profiles(id),
  shift_id uuid REFERENCES shifts(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE planning_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_shifts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "members_view_planning_weeks" ON planning_weeks FOR SELECT USING (EXISTS (SELECT 1 FROM establishment_members em WHERE em.establishment_id = planning_weeks.establishment_id AND em.profile_id = auth.uid() AND em.is_active = true)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "managers_manage_planning_weeks" ON planning_weeks FOR ALL USING (EXISTS (SELECT 1 FROM establishment_members em WHERE em.establishment_id = planning_weeks.establishment_id AND em.profile_id = auth.uid() AND em.is_active = true AND em.role IN ('owner','manager'))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "members_view_planning_shifts" ON planning_shifts FOR SELECT USING (EXISTS (SELECT 1 FROM establishment_members em WHERE em.establishment_id = planning_shifts.establishment_id AND em.profile_id = auth.uid() AND em.is_active = true)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "managers_manage_planning_shifts" ON planning_shifts FOR ALL USING (EXISTS (SELECT 1 FROM establishment_members em WHERE em.establishment_id = planning_shifts.establishment_id AND em.profile_id = auth.uid() AND em.is_active = true AND em.role IN ('owner','manager'))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "employees_confirm_own_shifts" ON planning_shifts FOR UPDATE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- confirmed field on shifts table (to track employee confirmation)
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS planning_shift_id uuid REFERENCES planning_shifts(id) ON DELETE SET NULL;
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS is_confirmed boolean DEFAULT false;
