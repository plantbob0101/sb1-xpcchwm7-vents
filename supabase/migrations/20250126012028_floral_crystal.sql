/*
  # Add model_id to structure_models table

  1. Changes
    - Add model_id column to structure_models table
    - Add foreign key constraint to greenhouse_models
    - Update RLS policies
*/

-- Add model_id column to structure_models
ALTER TABLE structure_models
ADD COLUMN model_id uuid REFERENCES greenhouse_models(id);

-- Enable RLS for the new column
CREATE POLICY "Enable read access for model_id"
  ON structure_models FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable write access for model_id"
  ON structure_models FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());