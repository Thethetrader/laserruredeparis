-- ============================================================
-- Carafe — Tâches récurrentes migration
-- Run in Supabase SQL Editor after migration_schedule_polls.sql
-- ============================================================

-- TASK TEMPLATES (liste type, définie par le patron)
create table if not exists task_templates (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid references establishments(id) on delete cascade not null,
  title text not null,
  description text,
  category text not null check (category in ('opening', 'closing', 'continuous', 'custom')),
  target_role text not null check (target_role in ('all', 'salle', 'cuisine', 'bar', 'manager')),
  frequency text not null default 'daily' check (frequency in ('daily', 'weekly', 'per_service')),
  requires_photo boolean default false,
  is_critical boolean default false,
  is_active boolean default true,
  display_order int default 0,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger task_templates_updated_at
  before update on task_templates
  for each row execute function update_updated_at();

-- TASK ONE SHOTS (tâches ponctuelles créées par les managers)
create table if not exists task_one_shots (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid references establishments(id) on delete cascade not null,
  created_by uuid references profiles(id) not null,
  title text not null,
  description text,
  target_role text not null check (target_role in ('all', 'salle', 'cuisine', 'bar', 'manager')),
  due_date date not null,
  requires_photo boolean default false,
  is_validated boolean default false,
  created_at timestamptz default now(),
  expires_at timestamptz
);

-- TASK COMPLETIONS (validations, qu'elles soient récurrentes ou ponctuelles)
create table if not exists task_completions (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid references establishments(id) on delete cascade not null,
  task_template_id uuid references task_templates(id) on delete cascade,
  task_one_shot_id uuid references task_one_shots(id) on delete cascade,
  validated_by uuid references profiles(id) not null,
  validated_at timestamptz default now(),
  photo_url text,
  notes text,
  service_date date not null,
  service_period text check (service_period in ('morning', 'evening', 'all_day')),
  is_catchup boolean default false,
  check (
    (task_template_id is not null and task_one_shot_id is null) or
    (task_template_id is null and task_one_shot_id is not null)
  )
);

-- Indexes
create index if not exists idx_task_completions_service_date on task_completions(establishment_id, service_date);
create index if not exists idx_task_completions_template on task_completions(task_template_id);
create index if not exists idx_task_templates_establishment on task_templates(establishment_id, is_active);
create index if not exists idx_task_one_shots_establishment on task_one_shots(establishment_id, due_date);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table task_templates enable row level security;
alter table task_one_shots enable row level security;
alter table task_completions enable row level security;

-- TASK TEMPLATES
create policy "members can view task templates" on task_templates
  for select using (
    exists (
      select 1 from establishment_members
      where establishment_id = task_templates.establishment_id
        and profile_id = auth.uid()
        and is_active = true
    )
  );

create policy "owners can insert task templates" on task_templates
  for insert with check (
    exists (
      select 1 from establishment_members
      where establishment_id = task_templates.establishment_id
        and profile_id = auth.uid()
        and role = 'owner'
        and is_active = true
    )
  );

create policy "owners can update task templates" on task_templates
  for update using (
    exists (
      select 1 from establishment_members
      where establishment_id = task_templates.establishment_id
        and profile_id = auth.uid()
        and role = 'owner'
        and is_active = true
    )
  );

create policy "owners can delete task templates" on task_templates
  for delete using (
    exists (
      select 1 from establishment_members
      where establishment_id = task_templates.establishment_id
        and profile_id = auth.uid()
        and role = 'owner'
        and is_active = true
    )
  );

-- TASK ONE SHOTS
create policy "members can view task one shots" on task_one_shots
  for select using (
    exists (
      select 1 from establishment_members
      where establishment_id = task_one_shots.establishment_id
        and profile_id = auth.uid()
        and is_active = true
    )
  );

create policy "managers can create task one shots" on task_one_shots
  for insert with check (
    exists (
      select 1 from establishment_members
      where establishment_id = task_one_shots.establishment_id
        and profile_id = auth.uid()
        and role in ('owner', 'manager')
        and is_active = true
    )
  );

create policy "creators and owners can update task one shots" on task_one_shots
  for update using (
    created_by = auth.uid() or
    exists (
      select 1 from establishment_members
      where establishment_id = task_one_shots.establishment_id
        and profile_id = auth.uid()
        and role = 'owner'
        and is_active = true
    )
  );

-- TASK COMPLETIONS
create policy "members can view task completions" on task_completions
  for select using (
    exists (
      select 1 from establishment_members
      where establishment_id = task_completions.establishment_id
        and profile_id = auth.uid()
        and is_active = true
    )
  );

create policy "members can create task completions" on task_completions
  for insert with check (
    validated_by = auth.uid() and
    exists (
      select 1 from establishment_members
      where establishment_id = task_completions.establishment_id
        and profile_id = auth.uid()
        and is_active = true
    )
  );

-- ============================================================
-- STORAGE BUCKET POUR LES PHOTOS DE TÂCHES
-- ============================================================

insert into storage.buckets (id, name, public) values ('task-photos', 'task-photos', false)
  on conflict do nothing;

create policy "Members can upload task photos"
  on storage.objects for insert with check (
    bucket_id = 'task-photos' and auth.uid() is not null
  );

create policy "Members can view task photos"
  on storage.objects for select using (
    bucket_id = 'task-photos' and auth.uid() is not null
  );

-- ============================================================
-- TÂCHES PAR DÉFAUT — À appeler lors de la création d'un établissement
-- Usage : select seed_default_tasks('<establishment_id>', '<owner_id>');
-- ============================================================

create or replace function seed_default_tasks(p_establishment_id uuid, p_owner_id uuid)
returns void language plpgsql security definer as $$
begin
  insert into task_templates
    (establishment_id, title, category, target_role, frequency, requires_photo, is_critical, display_order, created_by)
  values
    -- Ouverture / Manager
    (p_establishment_id, 'Ouverture caisse',                        'opening',  'manager', 'daily', true,  true,  1,  p_owner_id),
    (p_establishment_id, 'Contrôle température frigos',             'opening',  'manager', 'daily', true,  true,  2,  p_owner_id),
    (p_establishment_id, 'Briefing équipe',                         'opening',  'manager', 'daily', false, false, 3,  p_owner_id),
    -- Ouverture / Salle
    (p_establishment_id, 'Mise en place de la salle',               'opening',  'salle',   'daily', false, false, 4,  p_owner_id),
    (p_establishment_id, 'Mise en place du bar',                    'opening',  'salle',   'daily', false, false, 5,  p_owner_id),
    -- Ouverture / Cuisine
    (p_establishment_id, 'Mise en place cuisine',                   'opening',  'cuisine', 'daily', false, false, 6,  p_owner_id),
    (p_establishment_id, 'Contrôle réception marchandises',         'opening',  'cuisine', 'daily', false, false, 7,  p_owner_id),
    -- Fermeture / Manager
    (p_establishment_id, 'Fermeture caisse',                        'closing',  'manager', 'daily', true,  true,  8,  p_owner_id),
    (p_establishment_id, 'Contrôle fermeture des points sensibles', 'closing',  'manager', 'daily', true,  true,  9,  p_owner_id),
    -- Fermeture / Salle
    (p_establishment_id, 'Nettoyage salle',                         'closing',  'salle',   'daily', false, false, 10, p_owner_id),
    (p_establishment_id, 'Rangement bar',                           'closing',  'salle',   'daily', false, false, 11, p_owner_id),
    -- Fermeture / Cuisine
    (p_establishment_id, 'Nettoyage cuisine',                       'closing',  'cuisine', 'daily', false, false, 12, p_owner_id),
    (p_establishment_id, 'Nettoyage hotte',                         'closing',  'cuisine', 'daily', true,  true,  13, p_owner_id),
    (p_establishment_id, 'Plonge terminée',                         'closing',  'cuisine', 'daily', false, false, 14, p_owner_id);
end;
$$;
