-- ============================================================
-- Carafe — Tâches : assignation à une personne spécifique
-- À exécuter dans le SQL Editor Supabase après migration_tasks.sql
-- ============================================================

-- Une tâche peut être assignée à un membre précis (profile).
-- Si assigned_to est non-null, la tâche est destinée à cette personne
-- et NON plus au poste (target_role sert alors de simple indication).
alter table task_templates
  add column if not exists assigned_to uuid references profiles(id) on delete set null;

alter table task_one_shots
  add column if not exists assigned_to uuid references profiles(id) on delete set null;

create index if not exists idx_task_templates_assigned_to on task_templates(assigned_to);
create index if not exists idx_task_one_shots_assigned_to on task_one_shots(assigned_to);
