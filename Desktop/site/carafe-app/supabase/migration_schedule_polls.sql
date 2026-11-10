-- Vote RDV feature
-- Run this in Supabase SQL Editor

create table if not exists schedule_polls (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  created_by uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  proposed_date date not null,
  proposed_time time not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists schedule_poll_invitees (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references schedule_polls(id) on delete cascade,
  member_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poll_id, member_id)
);

create table if not exists schedule_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references schedule_polls(id) on delete cascade,
  voter_id uuid not null references profiles(id) on delete cascade,
  response text not null check (response in ('yes', 'no', 'maybe')),
  created_at timestamptz not null default now(),
  unique (poll_id, voter_id)
);

-- Indexes
create index if not exists idx_schedule_polls_establishment on schedule_polls(establishment_id);
create index if not exists idx_schedule_poll_invitees_poll on schedule_poll_invitees(poll_id);
create index if not exists idx_schedule_votes_poll on schedule_votes(poll_id);

-- RLS
alter table schedule_polls enable row level security;
alter table schedule_poll_invitees enable row level security;
alter table schedule_votes enable row level security;

-- Policies: members of the establishment can see polls
create policy "members can view polls" on schedule_polls
  for select using (
    exists (
      select 1 from establishment_members
      where establishment_id = schedule_polls.establishment_id
      and profile_id = auth.uid()
      and is_active = true
    )
  );

create policy "managers can create polls" on schedule_polls
  for insert with check (
    exists (
      select 1 from establishment_members
      where establishment_id = schedule_polls.establishment_id
      and profile_id = auth.uid()
      and role in ('owner', 'manager')
      and is_active = true
    )
  );

create policy "managers can update polls" on schedule_polls
  for update using (
    exists (
      select 1 from establishment_members
      where establishment_id = schedule_polls.establishment_id
      and profile_id = auth.uid()
      and role in ('owner', 'manager')
      and is_active = true
    )
  );

-- Invitees policies
create policy "members can view invitees" on schedule_poll_invitees
  for select using (
    exists (
      select 1 from schedule_polls sp
      join establishment_members em on em.establishment_id = sp.establishment_id
      where sp.id = schedule_poll_invitees.poll_id
      and em.profile_id = auth.uid()
      and em.is_active = true
    )
  );

create policy "managers can manage invitees" on schedule_poll_invitees
  for insert with check (
    exists (
      select 1 from schedule_polls sp
      join establishment_members em on em.establishment_id = sp.establishment_id
      where sp.id = schedule_poll_invitees.poll_id
      and em.profile_id = auth.uid()
      and em.role in ('owner', 'manager')
      and em.is_active = true
    )
  );

-- Votes policies
create policy "members can view votes" on schedule_votes
  for select using (
    exists (
      select 1 from schedule_polls sp
      join establishment_members em on em.establishment_id = sp.establishment_id
      where sp.id = schedule_votes.poll_id
      and em.profile_id = auth.uid()
      and em.is_active = true
    )
  );

create policy "invitees can vote" on schedule_votes
  for insert with check (
    voter_id = auth.uid()
    and exists (
      select 1 from schedule_poll_invitees
      where poll_id = schedule_votes.poll_id
      and member_id = auth.uid()
    )
  );

create policy "invitees can change vote" on schedule_votes
  for update using (voter_id = auth.uid());
