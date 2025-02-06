/*
  # Add project sharing capabilities
  
  1. New Tables
    - project_shares
      - id (uuid, primary key)
      - project_id (uuid, references projects)
      - shared_with_id (uuid, references auth.users)
      - created_at (timestamptz)
      - created_by (uuid, references auth.users)
      - permissions (text)

  2. Security
    - Enable RLS on project_shares table
    - Add policies for project owners and shared users
*/

-- Create project_shares table
CREATE TABLE project_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  shared_with_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  permissions text NOT NULL CHECK (permissions IN ('view', 'edit')),
  UNIQUE(project_id, shared_with_id)
);

-- Enable RLS
ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;

-- Update projects policies to include shared projects
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
CREATE POLICY "Users can view their own or shared projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR id IN (
      SELECT project_id 
      FROM project_shares 
      WHERE shared_with_id = auth.uid()
    )
  );

-- Policies for project_shares
CREATE POLICY "Users can view shares for their projects"
  ON project_shares FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
    OR shared_with_id = auth.uid()
  );

CREATE POLICY "Project owners can create shares"
  ON project_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can delete shares"
  ON project_shares FOR DELETE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );