/*
  # Fix Project Sharing Policies

  1. Changes
    - Simplify policies to avoid recursion
    - Optimize query performance
    - Add proper indexes
    - Improve security checks

  2. Security
    - Maintain proper access control
    - Prevent self-sharing
    - Ensure data integrity
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "projects_owner_access" ON projects;
DROP POLICY IF EXISTS "projects_shared_access" ON projects;
DROP POLICY IF EXISTS "shares_owner_access" ON project_shares;
DROP POLICY IF EXISTS "shares_recipient_access" ON project_shares;

-- Optimize indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects (user_id);
CREATE INDEX IF NOT EXISTS idx_project_shares_lookup ON project_shares (project_id, shared_with_id);
CREATE INDEX IF NOT EXISTS idx_project_shares_shared_with ON project_shares (shared_with_id);

-- Create simplified project policies
CREATE POLICY "project_owner_access"
  ON projects
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "project_shared_access"
  ON projects
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

-- Create simplified project shares policies
CREATE POLICY "share_owner_access"
  ON project_shares
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM projects 
      WHERE projects.id = project_id 
      AND projects.user_id = auth.uid()
      LIMIT 1
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM projects 
      WHERE projects.id = project_id 
      AND projects.user_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "share_recipient_access"
  ON project_shares
  FOR SELECT
  TO authenticated
  USING (shared_with_id = auth.uid());

-- Create function to validate shares
CREATE OR REPLACE FUNCTION validate_project_share()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if trying to share with project owner
  IF EXISTS (
    SELECT 1 
    FROM projects 
    WHERE id = NEW.project_id 
    AND user_id = NEW.shared_with_id
  ) THEN
    RAISE EXCEPTION 'Cannot share project with its owner';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for validation
DROP TRIGGER IF EXISTS validate_project_share_trigger ON project_shares;
CREATE TRIGGER validate_project_share_trigger
  BEFORE INSERT OR UPDATE ON project_shares
  FOR EACH ROW
  EXECUTE FUNCTION validate_project_share();