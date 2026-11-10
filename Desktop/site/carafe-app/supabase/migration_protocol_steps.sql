-- Add steps column to protocols table
-- steps is an ordered array of strings: ["Step 1", "Step 2", ...]
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS steps jsonb DEFAULT NULL;
