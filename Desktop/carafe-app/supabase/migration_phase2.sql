-- PROTOCOLS
create table if not exists protocols (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid references establishments(id) on delete cascade not null,
  author_id uuid references profiles(id) not null,
  title text not null,
  content text not null,
  category text default 'general' check (category in ('general','hygiene','service','security','opening','closing')),
  is_mandatory boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists protocol_reads (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid references protocols(id) on delete cascade not null,
  profile_id uuid references profiles(id) on delete cascade not null,
  read_at timestamptz default now(),
  unique(protocol_id, profile_id)
);

-- CUSTOMER FEEDBACK
create table if not exists customer_feedback (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid references establishments(id) on delete cascade not null,
  reported_by uuid references profiles(id),
  category text not null check (category in ('compliment','complaint','suggestion','incident')),
  content text not null,
  table_number text,
  status text default 'open' check (status in ('open','in_progress','resolved')),
  created_at timestamptz default now()
);

-- DELAYS
create table if not exists delays (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid references establishments(id) on delete cascade not null,
  employee_id uuid references profiles(id) not null,
  reported_by uuid references profiles(id),
  shift_date date not null,
  shift_type text check (shift_type in ('morning','afternoon','evening','night')),
  delay_minutes integer not null,
  reason text,
  created_at timestamptz default now()
);

-- CHALLENGES
create table if not exists challenges (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid references establishments(id) on delete cascade not null,
  created_by uuid references profiles(id) not null,
  title text not null,
  description text,
  target_value integer,
  current_value integer default 0,
  unit text,
  starts_at timestamptz default now(),
  ends_at timestamptz,
  status text default 'active' check (status in ('active','completed','cancelled')),
  created_at timestamptz default now()
);

-- PUSH SUBSCRIPTIONS
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  establishment_id uuid references establishments(id) on delete cascade not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now(),
  unique(profile_id, endpoint)
);

-- RLS
alter table protocols enable row level security;
alter table protocol_reads enable row level security;
alter table customer_feedback enable row level security;
alter table delays enable row level security;
alter table challenges enable row level security;
alter table push_subscriptions enable row level security;

create policy "Members can view protocols" on protocols for select using (
  exists (select 1 from establishment_members where establishment_id = protocols.establishment_id and profile_id = auth.uid() and is_active = true)
);
create policy "Managers can manage protocols" on protocols for all using (
  exists (select 1 from establishment_members where establishment_id = protocols.establishment_id and profile_id = auth.uid() and role in ('owner','manager') and is_active = true)
);
create policy "Members can read protocols" on protocol_reads for all using (auth.uid() = profile_id);

create policy "Members can view feedback" on customer_feedback for select using (
  exists (select 1 from establishment_members where establishment_id = customer_feedback.establishment_id and profile_id = auth.uid() and is_active = true)
);
create policy "Members can insert feedback" on customer_feedback for insert with check (
  exists (select 1 from establishment_members where establishment_id = customer_feedback.establishment_id and profile_id = auth.uid() and is_active = true)
);
create policy "Managers can update feedback" on customer_feedback for update using (
  exists (select 1 from establishment_members where establishment_id = customer_feedback.establishment_id and profile_id = auth.uid() and role in ('owner','manager') and is_active = true)
);

create policy "Members can view delays" on delays for select using (
  exists (select 1 from establishment_members where establishment_id = delays.establishment_id and profile_id = auth.uid() and is_active = true)
);
create policy "Members can insert delays" on delays for insert with check (
  exists (select 1 from establishment_members where establishment_id = delays.establishment_id and profile_id = auth.uid() and is_active = true)
);

create policy "Members can view challenges" on challenges for select using (
  exists (select 1 from establishment_members where establishment_id = challenges.establishment_id and profile_id = auth.uid() and is_active = true)
);
create policy "Managers can manage challenges" on challenges for all using (
  exists (select 1 from establishment_members where establishment_id = challenges.establishment_id and profile_id = auth.uid() and role in ('owner','manager') and is_active = true)
);

create policy "Users can manage own subscriptions" on push_subscriptions for all using (auth.uid() = profile_id);
