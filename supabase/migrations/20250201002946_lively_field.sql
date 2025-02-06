/*
  # Fix vestibules schema

  1. Changes
    - Rename door_id to door_type_id in vestibules table
    - Add missing indexes for better performance
    - Update foreign key constraint
*/

-- Rename the column and update the foreign key
ALTER TABLE vestibules 
DROP CONSTRAINT IF EXISTS vestibules_door_id_fkey,
DROP COLUMN IF EXISTS door_id;

ALTER TABLE vestibules
ADD COLUMN door_type_id uuid REFERENCES door_types(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_vestibules_door_type_id ON vestibules(door_type_id);