/*
  # Fix shared projects visibility
  
  1. Changes
    - Update project policies to properly handle shared projects
    - Add indexes for better performance
    - Update project_shares policies
*/

-- Drop existing project policies
DROP POLICY IF EXISTS "projects_select" ON projects;
DROP POLICY IF EXISTS "projects_insert" ON projects;
DROP POLICY IF EXISTS "projects_update" ON projects;
DROP POLICY IF EXISTS "projects_delete" ON projects;

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects (user_id);
CREATE INDEX IF NOT EXISTS idx_project_shares_lookup ON project_shares (project_id, shared_with_id);

-- Create new project policies
CREATE POLICY "projects_owner_access"
  ON projects
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "projects_shared_access"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT project_id 
      FROM project_shares 
      WHERE shared_with_id = auth.uid()
    )
  );

-- Update project_shares policies
DROP POLICY IF EXISTS "project_shares_select" ON project_shares;
DROP POLICY IF EXISTS "project_shares_insert" ON project_shares;
DROP POLICY IF EXISTS "project_shares_delete" ON project_shares;

CREATE POLICY "shares_access"
  ON project_shares
  FOR ALL
  TO authenticated
  USING (
    -- Can access shares where user is either the owner or recipient
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
    OR shared_with_id = auth.uid()
  )
  WITH CHECK (
    -- Can only create/update shares for owned projects
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );