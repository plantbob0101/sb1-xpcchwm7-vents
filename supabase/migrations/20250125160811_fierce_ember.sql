/*
  # Add contact fields to projects table

  1. Changes
    - Add ship_to_address column to projects table
    - Add phone column to projects table
    - Add email column to projects table

  2. Notes
    - All new fields are nullable to maintain compatibility with existing records
    - No data migration needed as these are new optional fields
*/

DO $$ 
BEGIN
  -- Add ship_to_address column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'ship_to_address'
  ) THEN
    ALTER TABLE projects ADD COLUMN ship_to_address TEXT;
  END IF;

  -- Add phone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'phone'
  ) THEN
    ALTER TABLE projects ADD COLUMN phone TEXT;
  END IF;

  -- Add email column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'email'
  ) THEN
    ALTER TABLE projects ADD COLUMN email TEXT;
  END IF;
END $$;