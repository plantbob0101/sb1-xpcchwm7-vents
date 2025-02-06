/*
  # Fix RLS policies to prevent recursion
  
  1. Changes
    - Drop all existing policies
    - Create new simplified policies that avoid recursive checks
    - Ensure proper access control for all operations
*/

-- Drop all existing policies for projects
DROP POLICY IF EXISTS "Users can view projects" ON projects;
DROP POLICY IF EXISTS "Users can insert projects" ON projects;
DROP POLICY IF EXISTS "Users can update projects" ON projects;
DROP POLICY IF EXISTS "Users can delete projects" ON projects;

-- Create new simplified policies
CREATE POLICY "Users can view projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 
      FROM project_shares 
      WHERE project_shares.project_id = projects.id 
      AND project_shares.shared_with_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());