/*
  # Fix RLS recursion with optimized policies
  
  1. Changes
    - Drop all existing project policies
    - Create new optimized policies with materialized checks
    - Add proper indexing for performance
    - Separate read and write policies for clarity
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "project_access_policy" ON projects;
DROP POLICY IF EXISTS "project_shared_access_policy" ON projects;

-- Create index for faster access checks
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects (user_id);
CREATE INDEX IF NOT EXISTS idx_project_shares_lookup ON project_shares (project_id, shared_with_id);

-- Create new optimized policies
CREATE POLICY "project_owner_policy"
  ON projects
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "project_shared_policy"
  ON projects
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM project_shares 
      WHERE project_shares.project_id = id 
        AND project_shares.shared_with_id = auth.uid()
      LIMIT 1
    )
  );