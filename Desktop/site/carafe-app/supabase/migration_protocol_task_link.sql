-- Lier les tâches récurrentes et ponctuelles à un protocole
alter table task_templates add column if not exists protocol_id uuid references protocols(id) on delete set null;
alter table task_one_shots   add column if not exists protocol_id uuid references protocols(id) on delete set null;
