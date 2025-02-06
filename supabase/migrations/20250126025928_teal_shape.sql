/*
  # Add glazing column to model_configurations

  1. Changes
    - Add glazing column to model_configurations table
    - Update existing configurations with default glazing value
*/

-- Add glazing column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'model_configurations' AND column_name = 'glazing'
  ) THEN
    ALTER TABLE model_configurations 
    ADD COLUMN glazing text;
  END IF;
END $$;