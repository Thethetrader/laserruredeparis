-- Stripe integration migration
-- Run this in Supabase SQL Editor

-- Table for pending signups (before Stripe payment is confirmed)
create table if not exists public.pending_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password text not null,
  first_name text not null,
  last_name text not null,
  establishment_name text not null,
  size text not null check (size in ('small', 'large')),
  stripe_session_id text,
  created_at timestamptz default now()
);

-- Clean up old pending signups automatically (1 hour TTL)
create or replace function delete_old_pending_signups() returns trigger language plpgsql as $$
begin
  delete from public.pending_signups where created_at < now() - interval '1 hour';
  return new;
end;
$$;

drop trigger if exists trg_delete_old_pending_signups on public.pending_signups;
create trigger trg_delete_old_pending_signups
  after insert on public.pending_signups
  execute procedure delete_old_pending_signups();

-- Add Stripe fields to profiles
alter table public.profiles add column if not exists stripe_customer_id text;

-- Add Stripe subscription id to establishments
alter table public.establishments add column if not exists stripe_subscription_id text;

-- RLS: pending_signups only accessible via service role (no user access)
alter table public.pending_signups enable row level security;
