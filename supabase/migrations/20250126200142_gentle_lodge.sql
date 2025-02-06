/*
  # Final Policy Fix

  1. Changes
    - Remove all complex policy logic
    - Use separate simple policies for each operation
    - Avoid any potential for recursion
    - Keep only essential indexes

  2. Security
    - Maintain proper access control
    - Prevent self-sharing
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "projects_owner_policy" ON projects;
DROP POLICY IF EXISTS "projects_shared_policy" ON projects;
DROP POLICY IF EXISTS "project_shares_policy" ON project_shares;

-- Keep essential indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_project_shares_lookup ON project_shares(project_id, shared_with_id);

-- Projects policies - split by operation
CREATE POLICY "projects_select_owner"
  ON projects
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "projects_select_shared"
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

CREATE POLICY "projects_insert"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "projects_update"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "projects_delete"
  ON projects
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Project shares policies - split by operation
CREATE POLICY "shares_select_owner"
  ON project_shares
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "shares_select_recipient"
  ON project_shares
  FOR SELECT
  TO authenticated
  USING (shared_with_id = auth.uid());

CREATE POLICY "shares_insert"
  ON project_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "shares_update"
  ON project_shares
  FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "shares_delete"
  ON project_shares
  FOR DELETE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Simple self-share prevention
DO $$ 
BEGIN
  -- Drop the trigger if it exists
  DROP TRIGGER IF EXISTS prevent_self_share_trigger ON project_shares;
  
  -- Drop the function if it exists
  DROP FUNCTION IF EXISTS prevent_self_share();
  
  -- Create the function
  CREATE FUNCTION prevent_self_share()
  RETURNS TRIGGER AS $FUNC$
  BEGIN
    IF EXISTS (
      SELECT 1 
      FROM projects 
      WHERE id = NEW.project_id AND user_id = NEW.shared_with_id
      LIMIT 1
    ) THEN
      RAISE EXCEPTION 'Cannot share project with its owner';
    END IF;
    RETURN NEW;
  END;
  $FUNC$ LANGUAGE plpgsql;

  -- Create the trigger
  CREATE TRIGGER prevent_self_share_trigger
    BEFORE INSERT OR UPDATE ON project_shares
    FOR EACH ROW
    EXECUTE FUNCTION prevent_self_share();
END $$;