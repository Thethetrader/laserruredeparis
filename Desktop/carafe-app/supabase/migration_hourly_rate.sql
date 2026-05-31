-- Add hourly_rate to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hourly_rate numeric(8,2) DEFAULT NULL;
