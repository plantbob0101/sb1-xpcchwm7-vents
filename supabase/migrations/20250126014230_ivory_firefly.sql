/*
  # Add structure model columns

  1. Changes
    - Add width, load, glazing, and eave columns to structure_models table
    - Drop old specification references that are no longer used
    - Update RLS policies for new columns

  2. Security
    - Enable RLS policies for new columns
*/

-- Drop old specification references
ALTER TABLE structure_models
DROP COLUMN IF EXISTS width_id,
DROP COLUMN IF EXISTS load_id,
DROP COLUMN IF EXISTS glazing_id,
DROP COLUMN IF EXISTS eave_id;

-- Add new direct columns
ALTER TABLE structure_models
ADD COLUMN width text,
ADD COLUMN load text,
ADD COLUMN glazing text,
ADD COLUMN eave text;

-- Enable RLS for the new columns
CREATE POLICY "Enable read access for structure columns"
  ON structure_models FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable write access for structure columns"
  ON structure_models FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());