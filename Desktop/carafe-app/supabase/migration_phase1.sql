-- ============================================================
-- Carafe — Phase 1 Migration
-- profiles + establishments + establishment_members
-- Run in Supabase SQL Editor
-- ============================================================

-- PROFILES
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  first_name text,
  last_name text,
  phone text,
  avatar_url text,
  external_combo_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ESTABLISHMENTS
create table if not exists establishments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) not null,
  name text not null,
  address text,
  city text,
  postal_code text,
  country text default 'FR',
  logo_url text,
  subscription_tier text default 'trial',
  subscription_status text default 'active',
  trial_ends_at timestamptz default (now() + interval '14 days'),
  weekly_recap_day text default 'monday',
  weekly_recap_enabled boolean default true,
  created_at timestamptz default now()
);

-- ESTABLISHMENT MEMBERS
create table if not exists establishment_members (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid references establishments(id) on delete cascade not null,
  profile_id uuid references profiles(id) on delete cascade not null,
  role text not null check (role in ('owner', 'manager', 'employee')),
  job_title text,
  hired_at date,
  joined_at timestamptz default now(),
  is_active boolean default true,
  unique(establishment_id, profile_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table establishments enable row level security;
alter table establishment_members enable row level security;

-- PROFILES policies
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Members can see profiles of their colleagues
create policy "Members can view colleague profiles"
  on profiles for select using (
    exists (
      select 1 from establishment_members em1
      join establishment_members em2 on em1.establishment_id = em2.establishment_id
      where em1.profile_id = auth.uid()
        and em2.profile_id = profiles.id
        and em1.is_active = true
        and em2.is_active = true
    )
  );

-- ESTABLISHMENTS policies
create policy "Members can view their establishments"
  on establishments for select using (
    exists (
      select 1 from establishment_members
      where establishment_id = establishments.id
        and profile_id = auth.uid()
        and is_active = true
    )
  );

create policy "Owners can update their establishments"
  on establishments for update using (owner_id = auth.uid());

create policy "Authenticated users can create establishments"
  on establishments for insert with check (auth.uid() = owner_id);

-- ESTABLISHMENT_MEMBERS policies
create policy "Members can view their establishment members"
  on establishment_members for select using (
    exists (
      select 1 from establishment_members em
      where em.establishment_id = establishment_members.establishment_id
        and em.profile_id = auth.uid()
        and em.is_active = true
    )
  );

create policy "Owners and managers can insert members"
  on establishment_members for insert with check (
    exists (
      select 1 from establishment_members em
      where em.establishment_id = establishment_members.establishment_id
        and em.profile_id = auth.uid()
        and em.role in ('owner', 'manager')
        and em.is_active = true
    )
    or (
      -- Owner creating first member (themselves)
      auth.uid() = profile_id
    )
  );

create policy "Owners and managers can update members"
  on establishment_members for update using (
    exists (
      select 1 from establishment_members em
      where em.establishment_id = establishment_members.establishment_id
        and em.profile_id = auth.uid()
        and em.role in ('owner', 'manager')
        and em.is_active = true
    )
  );

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('protocol-attachments', 'protocol-attachments', false) on conflict do nothing;

create policy "Avatar images are publicly accessible"
  on storage.objects for select using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert with check (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );
