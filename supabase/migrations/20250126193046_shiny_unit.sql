/*
  # Final fix for RLS policies
  
  1. Changes
    - Drop all existing project policies
    - Create new optimized policies with no circular dependencies
    - Use materialized subqueries for better performance
    - Add proper indexing for faster access
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "project_select_policy" ON projects;
DROP POLICY IF EXISTS "project_insert_policy" ON projects;
DROP POLICY IF EXISTS "project_update_policy" ON projects;
DROP POLICY IF EXISTS "project_delete_policy" ON projects;

-- Create index for faster sharing lookups
CREATE INDEX IF NOT EXISTS idx_project_shares_lookup 
ON project_shares (project_id, shared_with_id);

-- Create new optimized policies
CREATE POLICY "project_access_policy"
  ON projects
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    -- Simple ownership check
    user_id = auth.uid()
  )
  WITH CHECK (
    -- Only allow modifications for owners
    user_id = auth.uid()
  );

-- Separate policy for shared access (read-only)
CREATE POLICY "project_shared_access_policy"
  ON projects
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    -- Efficient sharing check
    EXISTS (
      SELECT 1 
      FROM project_shares 
      WHERE 
        project_shares.project_id = projects.id 
        AND project_shares.shared_with_id = auth.uid()
      LIMIT 1
    )
  );