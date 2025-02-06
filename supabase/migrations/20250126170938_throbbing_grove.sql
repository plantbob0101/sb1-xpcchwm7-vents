/*
  # Add project archiving

  1. Changes
    - Add archived column to projects table
    - Set default value to false
    - Update existing rows to have archived = false
*/

-- Add archived column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'archived'
  ) THEN
    ALTER TABLE projects 
    ADD COLUMN archived boolean DEFAULT false;
  END IF;
END $$;