/*
  # Add Structure Description

  1. New Tables
    - `structure_descriptions`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `name` (text)
      - `description` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes
    - Add foreign key from structure_models to structure_descriptions
    - Enable RLS on structure_descriptions table
    - Add policies for authenticated users

  3. Security
    - Enable RLS
    - Add policies for authenticated users to manage their own descriptions
*/

-- Create structure_descriptions table
CREATE TABLE structure_descriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add description_id to structure_models
ALTER TABLE structure_models
ADD COLUMN description_id uuid REFERENCES structure_descriptions(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE structure_descriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own structure descriptions"
  ON structure_descriptions
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create structure descriptions"
  ON structure_descriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own structure descriptions"
  ON structure_descriptions
  FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own structure descriptions"
  ON structure_descriptions
  FOR DELETE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );