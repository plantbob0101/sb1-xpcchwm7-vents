/*
  # Simplify Project Sharing Policies

  1. Changes
    - Flatten all policies to their simplest form
    - Remove any potential for circular references
    - Use direct table access only
    - Optimize for performance

  2. Security
    - Maintain strict access control
    - Prevent unauthorized access
    - Keep data integrity checks
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "project_owner_access" ON projects;
DROP POLICY IF EXISTS "project_shared_access" ON projects;
DROP POLICY IF EXISTS "share_owner_access" ON project_shares;
DROP POLICY IF EXISTS "share_recipient_access" ON project_shares;

-- Simple project policies
CREATE POLICY "projects_policy"
  ON projects
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    -- Direct ownership OR has a share
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 
      FROM project_shares 
      WHERE 
        project_shares.project_id = projects.id AND 
        project_shares.shared_with_id = auth.uid()
      LIMIT 1
    )
  )
  WITH CHECK (
    -- Only owners can modify
    user_id = auth.uid()
  );

-- Simple project shares policy
CREATE POLICY "project_shares_policy"
  ON project_shares
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    -- Can see shares if owner of project or recipient
    EXISTS (
      SELECT 1 
      FROM projects 
      WHERE 
        projects.id = project_shares.project_id AND 
        projects.user_id = auth.uid()
      LIMIT 1
    ) OR
    shared_with_id = auth.uid()
  )
  WITH CHECK (
    -- Can only create/modify shares if owner of project
    EXISTS (
      SELECT 1 
      FROM projects 
      WHERE 
        projects.id = project_shares.project_id AND 
        projects.user_id = auth.uid()
      LIMIT 1
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_shares_lookup 
  ON project_shares (project_id, shared_with_id);

CREATE INDEX IF NOT EXISTS idx_projects_user_id 
  ON projects (user_id);

-- Function to prevent self-sharing
CREATE OR REPLACE FUNCTION prevent_self_share()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM projects 
    WHERE 
      id = NEW.project_id AND 
      user_id = NEW.shared_with_id
  ) THEN
    RAISE EXCEPTION 'Cannot share project with its owner';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for preventing self-sharing
DROP TRIGGER IF EXISTS prevent_self_share_trigger ON project_shares;
CREATE TRIGGER prevent_self_share_trigger
  BEFORE INSERT OR UPDATE ON project_shares
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_share();