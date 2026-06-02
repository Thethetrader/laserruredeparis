ALTER TABLE invitations ADD COLUMN IF NOT EXISTS staff_status text DEFAULT NULL;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS hourly_rate numeric(8,2) DEFAULT NULL;
