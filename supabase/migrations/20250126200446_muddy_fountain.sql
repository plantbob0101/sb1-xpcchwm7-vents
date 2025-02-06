-- Drop all existing policies
DROP POLICY IF EXISTS "project_owner_access" ON projects;
DROP POLICY IF EXISTS "project_shared_read" ON projects;
DROP POLICY IF EXISTS "share_owner_access" ON project_shares;
DROP POLICY IF EXISTS "share_recipient_read" ON project_shares;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS prevent_self_share_trigger ON project_shares;
DROP FUNCTION IF EXISTS prevent_self_share();

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_project_shares_lookup ON project_shares(project_id, shared_with_id);

-- Create non-recursive policies for projects
CREATE POLICY "project_access"
  ON projects
  FOR ALL
  TO authenticated
  USING (
    -- Direct ownership check
    user_id = auth.uid()
  )
  WITH CHECK (
    -- Only owners can modify
    user_id = auth.uid()
  );

CREATE POLICY "project_shared_access"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    -- Direct share check without recursion
    EXISTS (
      SELECT 1 
      FROM project_shares 
      WHERE project_shares.project_id = id 
      AND project_shares.shared_with_id = auth.uid()
      LIMIT 1
    )
  );

-- Create non-recursive policies for project_shares
CREATE POLICY "share_access"
  ON project_shares
  FOR ALL
  TO authenticated
  USING (
    -- Direct ownership or recipient check
    shared_with_id = auth.uid() OR
    EXISTS (
      SELECT 1 
      FROM projects 
      WHERE projects.id = project_id 
      AND projects.user_id = auth.uid()
      LIMIT 1
    )
  )
  WITH CHECK (
    -- Only project owners can modify shares
    EXISTS (
      SELECT 1 
      FROM projects 
      WHERE projects.id = project_id 
      AND projects.user_id = auth.uid()
      LIMIT 1
    )
  );

-- Create simple self-share prevention
CREATE OR REPLACE FUNCTION prevent_self_share()
RETURNS TRIGGER AS $$
BEGIN
  -- Direct ownership check without recursion
  IF EXISTS (
    SELECT 1 
    FROM projects 
    WHERE id = NEW.project_id 
    AND user_id = NEW.shared_with_id
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'Cannot share project with its owner';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER prevent_self_share_trigger
  BEFORE INSERT OR UPDATE ON project_shares
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_share();