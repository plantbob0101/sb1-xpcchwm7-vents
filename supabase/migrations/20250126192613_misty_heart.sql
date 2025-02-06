/*
  # Fix RLS policies for projects and sharing
  
  1. Changes
    - Drop and recreate project policies to avoid recursion
    - Ensure proper access control for project owners and shared users
    - Maintain existing project modification policies
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own or shared projects" ON projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can view shared projects" ON projects;

-- Create new policies for viewing projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM project_shares 
      WHERE project_shares.project_id = id 
      AND project_shares.shared_with_id = auth.uid()
    )
  );