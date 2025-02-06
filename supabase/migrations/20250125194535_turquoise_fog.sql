/*
  # Update Structure Configuration

  1. Changes
    - Safely remove existing options and selections
    - Update structure specifications with exact values
    - Add project linking capability

  2. Security
    - Maintains existing RLS policies
*/

-- First, safely remove existing selections and options
DO $$ 
BEGIN
  -- Delete user selections for the options we want to remove
  DELETE FROM user_selections
  WHERE option_id IN (
    SELECT id FROM options 
    WHERE name IN ('Standard Greenhouse', 'Premium Greenhouse')
  );

  -- Now we can safely delete the options
  DELETE FROM options 
  WHERE name IN ('Standard Greenhouse', 'Premium Greenhouse');
END $$;

-- Add project_id to structure_models if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'structure_models' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE structure_models 
    ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update structure specifications with exact values
DO $$ 
BEGIN
  -- First, update any existing structure_models to use NULL for their specification references
  -- This prevents foreign key constraint violations
  UPDATE structure_models 
  SET width_id = NULL, 
      load_id = NULL, 
      glazing_id = NULL, 
      eave_id = NULL;

  -- Store existing specifications that are referenced by structure_models
  CREATE TEMP TABLE spec_mapping (
    old_id uuid,
    type text,
    value text
  );

  INSERT INTO spec_mapping
  SELECT id, type, value 
  FROM structure_specifications;

  -- Now we can safely delete and recreate the specifications
  DELETE FROM structure_specifications;
  
  -- Insert new specifications and map them back to models
  WITH new_specs AS (
    INSERT INTO structure_specifications (type, value, display_order) VALUES
      -- Width options
      ('width', '18', 1),
      ('width', '21', 2),
      ('width', '24', 3),
      ('width', '30', 4),
      -- Load options (PSF)
      ('load', '10', 1),
      ('load', '20', 2),
      ('load', '30', 3),
      -- Glazing options
      ('glazing', 'Single Layer', 1),
      ('glazing', 'Double Layer', 2),
      ('glazing', 'Triple Layer', 3),
      -- Eave options (ft)
      ('eave', '8', 1),
      ('eave', '10', 2),
      ('eave', '12', 3),
      ('eave', '14', 4)
    RETURNING id, type, value
  )
  -- Update structure_models with new specification IDs where possible
  UPDATE structure_models sm
  SET 
    width_id = ns.id
  FROM new_specs ns
  JOIN spec_mapping sm_old ON sm_old.type = ns.type AND sm_old.value = ns.value
  WHERE sm_old.type = 'width';

  -- Clean up
  DROP TABLE spec_mapping;
END $$;