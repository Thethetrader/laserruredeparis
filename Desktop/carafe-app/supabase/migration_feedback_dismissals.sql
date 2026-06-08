create table if not exists feedback_dismissals (
  profile_id uuid references auth.users(id) on delete cascade,
  feedback_id uuid references customer_feedback(id) on delete cascade,
  dismissed_at timestamptz default now(),
  primary key (profile_id, feedback_id)
);

alter table feedback_dismissals enable row level security;

create policy "Users can manage their own dismissals"
  on feedback_dismissals for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);
