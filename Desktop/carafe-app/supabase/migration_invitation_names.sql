-- Ajouter first_name, last_name, phone à la table invitations
alter table public.invitations add column if not exists first_name text;
alter table public.invitations add column if not exists last_name text;
alter table public.invitations add column if not exists phone text;
