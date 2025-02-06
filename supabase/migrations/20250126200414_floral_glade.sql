-- Drop all existing policies
DROP POLICY IF EXISTS "projects_select_owner" ON projects;
DROP POLICY IF EXISTS "projects_select_shared" ON projects;
DROP POLICY IF EXISTS "projects_insert" ON projects;
DROP POLICY IF EXISTS "projects_update" ON projects;
DROP POLICY IF EXISTS "projects_delete" ON projects;
DROP POLICY IF EXISTS "shares_select_owner" ON project_shares;
DROP POLICY IF EXISTS "shares_select_recipient" ON project_shares;
DROP POLICY IF EXISTS "shares_insert" ON project_shares;
DROP POLICY IF EXISTS "shares_update" ON project_shares;
DROP POLICY IF EXISTS "shares_delete" ON project_shares;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS prevent_self_share_trigger ON project_shares;
DROP FUNCTION IF EXISTS prevent_self_share();

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_project_shares_lookup ON project_shares(project_id, shared_with_id);

-- Create simplified policies for projects
CREATE POLICY "project_owner_access"
  ON projects
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "project_shared_read"
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

-- Create simplified policies for project_shares
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

CREATE POLICY "share_recipient_read"
  ON project_shares
  FOR SELECT
  TO authenticated
  USING (shared_with_id = auth.uid());

-- Create new self-share prevention function
CREATE OR REPLACE FUNCTION prevent_self_share()
RETURNS TRIGGER AS $$
DECLARE
  project_owner_id uuid;
BEGIN
  SELECT user_id INTO project_owner_id
  FROM projects
  WHERE id = NEW.project_id;

  IF project_owner_id = NEW.shared_with_id THEN
    RAISE EXCEPTION 'Cannot share project with its owner';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger
CREATE TRIGGER prevent_self_share_trigger
  BEFORE INSERT OR UPDATE ON project_shares
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_share();