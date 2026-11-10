-- Table pour le système de "claim" de tâches
-- Un employé peut s'assigner une tâche avant de la valider

CREATE TABLE IF NOT EXISTS task_claims (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  task_template_id uuid REFERENCES task_templates(id) ON DELETE CASCADE,
  task_one_shot_id uuid REFERENCES task_one_shots(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  first_name text,
  service_date date NOT NULL,
  claimed_at timestamptz DEFAULT now()
);

-- Un seul claim par tâche par jour
CREATE UNIQUE INDEX IF NOT EXISTS task_claims_tmpl
  ON task_claims (task_template_id, service_date)
  WHERE task_template_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS task_claims_shot
  ON task_claims (task_one_shot_id, service_date)
  WHERE task_one_shot_id IS NOT NULL;

ALTER TABLE task_claims ENABLE ROW LEVEL SECURITY;

-- Tous les membres de l'établissement peuvent voir les claims
CREATE POLICY claims_sel ON task_claims FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM establishment_members em
    WHERE em.establishment_id = task_claims.establishment_id
      AND em.profile_id = auth.uid()
      AND em.is_active = true
  )
);

-- Un membre peut créer un claim pour lui-même
CREATE POLICY claims_ins ON task_claims FOR INSERT WITH CHECK (
  profile_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM establishment_members em
    WHERE em.establishment_id = task_claims.establishment_id
      AND em.profile_id = auth.uid()
      AND em.is_active = true
  )
);

-- Seul le claimeur peut supprimer son claim (ou un manager)
CREATE POLICY claims_del ON task_claims FOR DELETE USING (
  profile_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM establishment_members em
    WHERE em.establishment_id = task_claims.establishment_id
      AND em.profile_id = auth.uid()
      AND em.is_active = true
      AND em.role IN ('owner', 'manager')
  )
);
