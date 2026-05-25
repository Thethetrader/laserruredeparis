-- Migration: système d'invitations
-- À exécuter dans le SQL Editor de Supabase (app.supabase.com → SQL Editor)

create table if not exists public.invitations (
  id uuid default gen_random_uuid() primary key,
  establishment_id uuid references public.establishments(id) on delete cascade not null,
  email text,
  role text not null check (role in ('manager', 'employee')),
  token uuid default gen_random_uuid() unique not null,
  invited_by uuid references public.profiles(id) not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz default now()
);

alter table public.invitations enable row level security;

-- Les membres actifs peuvent voir les invitations de leur établissement
create policy "members_view_invitations" on public.invitations
  for select using (
    exists (
      select 1 from public.establishment_members em
      where em.establishment_id = invitations.establishment_id
      and em.profile_id = auth.uid()
      and em.is_active = true
    )
  );

-- Owners et managers peuvent créer des invitations
create policy "managers_create_invitations" on public.invitations
  for insert with check (
    exists (
      select 1 from public.establishment_members em
      where em.establishment_id = invitations.establishment_id
      and em.profile_id = auth.uid()
      and em.is_active = true
      and em.role in ('owner', 'manager')
    )
  );

-- Service role peut tout faire (pour accept via API)
-- (pas de restriction supplémentaire, le service_role bypass les RLS par défaut)
