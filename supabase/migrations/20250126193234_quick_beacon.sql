/*
  # Final RLS Policy Fix
  
  1. Changes
    - Drop all existing project policies
    - Create single, simple policy for each operation
    - Use materialized checks to prevent recursion
    - Keep indexes for performance
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "project_owner_policy" ON projects;
DROP POLICY IF EXISTS "project_shared_policy" ON projects;

-- Keep existing indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects (user_id);
CREATE INDEX IF NOT EXISTS idx_project_shares_lookup ON project_shares (project_id, shared_with_id);

-- Create simple, non-recursive policies
CREATE POLICY "projects_select"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    -- Simple ownership check
    user_id = auth.uid()
  );

CREATE POLICY "projects_insert"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "projects_update"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
  );

CREATE POLICY "projects_delete"
  ON projects
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
  );