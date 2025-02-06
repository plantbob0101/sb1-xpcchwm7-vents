-- Drop all existing policies
DROP POLICY IF EXISTS "project_access" ON projects;
DROP POLICY IF EXISTS "project_shared_access" ON projects;
DROP POLICY IF EXISTS "share_access" ON project_shares;

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_project_shares_lookup ON project_shares(project_id, shared_with_id);

-- Create a function to get all accessible projects
CREATE OR REPLACE FUNCTION get_accessible_projects()
RETURNS SETOF projects
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT p.*
  FROM projects p
  LEFT JOIN project_shares ps ON p.id = ps.project_id
  WHERE 
    p.user_id = auth.uid() OR
    ps.shared_with_id = auth.uid()
  ORDER BY p.created_at DESC;
$$;

-- Create basic RLS policies
CREATE POLICY "project_access"
  ON projects
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "share_access"
  ON project_shares
  FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
    OR shared_with_id = auth.uid()
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Create function to prevent self-sharing if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = 'check_project_share'
  ) THEN
    CREATE FUNCTION check_project_share()
    RETURNS TRIGGER AS $FUNC$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM projects 
        WHERE id = NEW.project_id 
        AND user_id = NEW.shared_with_id
      ) THEN
        RAISE EXCEPTION 'Cannot share project with its owner';
      END IF;
      RETURN NEW;
    END;
    $FUNC$ LANGUAGE plpgsql;
  END IF;
END $$;

-- Create trigger only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'check_project_share_trigger'
  ) THEN
    CREATE TRIGGER check_project_share_trigger
      BEFORE INSERT OR UPDATE ON project_shares
      FOR EACH ROW
      EXECUTE FUNCTION check_project_share();
  END IF;
END $$;