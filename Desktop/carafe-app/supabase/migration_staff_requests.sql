-- ============================================================
-- Carafe — Staff Requests Migration
-- Demandes du personnel détectées via IA dans le chat
-- ============================================================

create table if not exists staff_requests (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid references establishments(id) on delete cascade not null,
  profile_id uuid references profiles(id) on delete cascade not null,
  chat_message_id uuid,
  request_type text not null check (request_type in (
    'leave', 'unavailability', 'late', 'early_leave', 'shift_swap', 'other'
  )),
  dates date[],
  time_requested time,
  reason text,
  summary text not null,
  original_message text not null,
  status text default 'pending_employee_confirmation' check (status in (
    'pending_employee_confirmation',
    'pending_manager',
    'approved',
    'rejected',
    'cancelled'
  )),
  confirmed_by_employee_at timestamptz,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  manager_note text,
  integrated_to_planning boolean default false,
  integrated_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table staff_requests enable row level security;

-- Employee: voit ses propres demandes
create policy "employee_view_own_requests"
  on staff_requests for select
  using (auth.uid() = profile_id);

-- Manager/Owner: voit toutes les demandes de l'établissement
create policy "manager_view_establishment_requests"
  on staff_requests for select
  using (
    exists (
      select 1 from establishment_members em
      where em.establishment_id = staff_requests.establishment_id
        and em.profile_id = auth.uid()
        and em.role in ('owner', 'manager')
        and em.is_active = true
    )
  );

-- Employee: peut créer ses propres demandes
create policy "employee_create_request"
  on staff_requests for insert
  with check (
    auth.uid() = profile_id
    and exists (
      select 1 from establishment_members em
      where em.establishment_id = staff_requests.establishment_id
        and em.profile_id = auth.uid()
        and em.is_active = true
    )
  );

-- Employee: peut annuler ses propres demandes en attente
create policy "employee_cancel_own_request"
  on staff_requests for update
  using (
    auth.uid() = profile_id
    and status in ('pending_employee_confirmation', 'pending_manager')
  );

-- Manager/Owner: peut approuver ou refuser les demandes
create policy "manager_update_requests"
  on staff_requests for update
  using (
    exists (
      select 1 from establishment_members em
      where em.establishment_id = staff_requests.establishment_id
        and em.profile_id = auth.uid()
        and em.role in ('owner', 'manager')
        and em.is_active = true
    )
  );

-- Index pour les requêtes fréquentes
create index if not exists staff_requests_establishment_idx on staff_requests(establishment_id);
create index if not exists staff_requests_profile_idx on staff_requests(profile_id);
create index if not exists staff_requests_status_idx on staff_requests(status);
