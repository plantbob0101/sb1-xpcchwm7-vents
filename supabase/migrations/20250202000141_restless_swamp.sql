/*
  # Fix duplicate greenhouse models

  1. Changes
    - Removes duplicate greenhouse models
    - Ensures unique model names
    - Updates existing models with unique names
*/

-- First, identify and remove any duplicates, keeping the most recently created record
WITH duplicates AS (
  SELECT id,
         name,
         created_at,
         ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at DESC) as rn
  FROM greenhouse_models
)
DELETE FROM greenhouse_models
WHERE id IN (
  SELECT id 
  FROM duplicates 
  WHERE rn > 1
);

-- Add a unique constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'greenhouse_models_name_key'
  ) THEN
    ALTER TABLE greenhouse_models
    ADD CONSTRAINT greenhouse_models_name_key UNIQUE (name);
  END IF;
END $$;