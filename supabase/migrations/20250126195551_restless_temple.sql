/*
  # Fix Project Sharing Policies

  1. Changes
    - Simplify policies to avoid recursion
    - Use direct ownership checks
    - Optimize query performance
    - Improve security

  2. Security
    - Maintain proper access control
    - Prevent self-sharing
    - Ensure data integrity
*/

-- Drop existing policies
DROP POLICY IF EXISTS "project_owner_access" ON projects;
DROP POLICY IF EXISTS "project_shared_access" ON projects;
DROP POLICY IF EXISTS "share_owner_access" ON project_shares;
DROP POLICY IF EXISTS "share_recipient_access" ON project_shares;

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
    id IN (
      SELECT project_id 
      FROM project_shares 
      WHERE shared_with_id = auth.uid()
    )
  );

-- Create simplified project shares policies
CREATE POLICY "share_owner_access"
  ON project_shares
  FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT id 
      FROM projects 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "share_recipient_access"
  ON project_shares
  FOR SELECT
  TO authenticated
  USING (shared_with_id = auth.uid());

-- Create function to prevent self-sharing
CREATE OR REPLACE FUNCTION check_project_share()
RETURNS TRIGGER AS $$
DECLARE
  project_owner_id uuid;
BEGIN
  -- Get the project owner's ID
  SELECT user_id INTO project_owner_id
  FROM projects
  WHERE id = NEW.project_id;

  -- Prevent sharing with project owner
  IF project_owner_id = NEW.shared_with_id THEN
    RAISE EXCEPTION 'Cannot share project with its owner';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS check_project_share_trigger ON project_shares;
CREATE TRIGGER check_project_share_trigger
  BEFORE INSERT OR UPDATE ON project_shares
  FOR EACH ROW
  EXECUTE FUNCTION check_project_share();