-- Migration: Add avatar_changed column to profiles
-- Allows users to change their avatar only once after registration

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_changed BOOLEAN DEFAULT FALSE;

-- Comment explaining the column
COMMENT ON COLUMN profiles.avatar_changed IS 'Tracks if user has used their one-time avatar change';

-- Also ensure name_changed exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name_changed BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN profiles.name_changed IS 'Tracks if user has used their one-time name change';
