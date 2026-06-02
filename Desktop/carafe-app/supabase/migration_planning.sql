-- Carafe — Planning IA
-- Tables pour la génération et gestion du planning hebdomadaire par l'IA
-- À exécuter dans Supabase SQL Editor

create table if not exists planning_weeks (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  week_start date not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  service_needs jsonb,
  generated_at timestamptz,
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  unique (establishment_id, week_start)
);

create table if not exists planning_shifts (
  id uuid primary key default gen_random_uuid(),
  planning_week_id uuid not null references planning_weeks(id) on delete cascade,
  establishment_id uuid not null references establishments(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  service text,
  confirmation_status text not null default 'pending' check (confirmation_status in ('pending', 'confirmed', 'modified')),
  confirmed_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_planning_weeks_establishment on planning_weeks(establishment_id);
create index if not exists idx_planning_weeks_week on planning_weeks(week_start);
create index if not exists idx_planning_shifts_week on planning_shifts(planning_week_id);
create index if not exists idx_planning_shifts_user on planning_shifts(user_id);
create index if not exists idx_planning_shifts_date on planning_shifts(shift_date);

alter table planning_weeks enable row level security;
alter table planning_shifts enable row level security;

create policy "Managers can manage planning_weeks" on planning_weeks for all using (
  exists (select 1 from establishment_members where establishment_id = planning_weeks.establishment_id and profile_id = auth.uid() and role in ('owner','manager') and is_active = true)
);

create policy "Members can view planning_shifts" on planning_shifts for select using (
  exists (select 1 from establishment_members where establishment_id = planning_shifts.establishment_id and profile_id = auth.uid() and is_active = true)
);

create policy "Managers can manage planning_shifts" on planning_shifts for all using (
  exists (select 1 from establishment_members where establishment_id = planning_shifts.establishment_id and profile_id = auth.uid() and role in ('owner','manager') and is_active = true)
);

create policy "Members can confirm own planning shifts" on planning_shifts for update using (
  auth.uid() = user_id
) with check (
  confirmation_status in ('confirmed', 'modified')
);
