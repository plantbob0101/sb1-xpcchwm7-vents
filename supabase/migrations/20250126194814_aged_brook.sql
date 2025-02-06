/*
  # Fix project sharing functionality
  
  1. Changes
    - Add trigger to sync existing users to profiles
    - Add index on profiles.email for faster lookups
    - Update project_shares policies
*/

-- Sync existing users to profiles
INSERT INTO profiles (id, email)
SELECT id, email::text
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles (email);

-- Update project_shares policies
DROP POLICY IF EXISTS "Users can view shares for their projects" ON project_shares;
DROP POLICY IF EXISTS "Project owners can create shares" ON project_shares;
DROP POLICY IF EXISTS "Project owners can delete shares" ON project_shares;

CREATE POLICY "project_shares_select"
  ON project_shares
  FOR SELECT
  TO authenticated
  USING (
    -- Can view shares for owned projects or shares where user is the recipient
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
    OR shared_with_id = auth.uid()
  );

CREATE POLICY "project_shares_insert"
  ON project_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Can only share owned projects
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "project_shares_delete"
  ON project_shares
  FOR DELETE
  TO authenticated
  USING (
    -- Can only delete shares for owned projects
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );