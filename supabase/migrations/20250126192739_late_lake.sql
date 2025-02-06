/*
  # Fix RLS policies to prevent recursion
  
  1. Changes
    - Drop all existing policies
    - Create new simplified policies that avoid recursive checks
    - Ensure proper access control for all operations
*/

-- Drop all existing policies for projects
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can view shared projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- Create a single view policy that handles both owned and shared projects
CREATE POLICY "Users can view projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR id IN (
      SELECT project_id 
      FROM project_shares 
      WHERE shared_with_id = auth.uid()
    )
  );

-- Create separate policies for write operations (only for owned projects)
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