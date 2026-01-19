-- Migration: Add name_changed column to profiles
-- Allows users to change their name only once after registration

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name_changed BOOLEAN DEFAULT FALSE;

-- Comment explaining the column
COMMENT ON COLUMN profiles.name_changed IS 'Tracks if user has used their one-time name change';
