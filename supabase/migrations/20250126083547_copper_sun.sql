/*
  # Add gutter_connect column to greenhouse_models

  1. Changes
    - Add gutter_connect boolean column to greenhouse_models table with default value of false
    - Add gutter_connect to existing models

  2. Notes
    - This is a non-destructive change that adds functionality for gutter-connected greenhouses
*/

-- Add gutter_connect column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'greenhouse_models' AND column_name = 'gutter_connect'
  ) THEN
    ALTER TABLE greenhouse_models 
    ADD COLUMN gutter_connect boolean DEFAULT false;
  END IF;
END $$;

-- Update existing models with gutter_connect values
UPDATE greenhouse_models
SET gutter_connect = true
WHERE name IN ('Venlo', 'Elite Series');