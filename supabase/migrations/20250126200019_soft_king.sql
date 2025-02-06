/*
  # Fix Policy Recursion

  1. Changes
    - Simplify project policies to avoid recursion
    - Use direct joins instead of EXISTS clauses
    - Optimize indexes for performance
    - Keep self-share prevention

  2. Security
    - Maintain RLS for projects and shares
    - Ensure proper access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "projects_policy" ON projects;
DROP POLICY IF EXISTS "project_shares_policy" ON project_shares;

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_project_shares_lookup ON project_shares(project_id, shared_with_id);

-- Simple owner-based policy for projects
CREATE POLICY "projects_owner_policy"
  ON projects
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Separate read-only policy for shared projects
CREATE POLICY "projects_shared_policy"
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

-- Simple policy for project shares
CREATE POLICY "project_shares_policy"
  ON project_shares
  FOR ALL
  TO authenticated
  USING (
    -- Can view if owner or recipient
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR shared_with_id = auth.uid()
  )
  WITH CHECK (
    -- Can only modify if project owner
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Keep the self-share prevention trigger
CREATE OR REPLACE FUNCTION prevent_self_share()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.shared_with_id IN (
    SELECT user_id 
    FROM projects 
    WHERE id = NEW.project_id
  ) THEN
    RAISE EXCEPTION 'Cannot share project with its owner';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS prevent_self_share_trigger ON project_shares;
CREATE TRIGGER prevent_self_share_trigger
  BEFORE INSERT OR UPDATE ON project_shares
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_share();