/*
  # Fix RLS recursion with optimized policies
  
  1. Changes
    - Drop all existing project policies
    - Create new optimized policies that avoid recursion
    - Simplify the sharing check logic
    - Ensure proper access control without circular dependencies
*/

-- Drop all existing policies for projects
DROP POLICY IF EXISTS "Users can view projects" ON projects;
DROP POLICY IF EXISTS "Users can insert projects" ON projects;
DROP POLICY IF EXISTS "Users can update projects" ON projects;
DROP POLICY IF EXISTS "Users can delete projects" ON projects;

-- Create new optimized policies
CREATE POLICY "project_select_policy"
  ON projects FOR SELECT
  TO authenticated
  USING (
    -- Direct ownership check
    user_id = auth.uid() 
    OR 
    -- Efficient sharing check without recursion
    EXISTS (
      SELECT 1 
      FROM project_shares 
      WHERE project_shares.project_id = projects.id 
      AND project_shares.shared_with_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "project_insert_policy"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "project_update_policy"
  ON projects FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "project_delete_policy"
  ON projects FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());