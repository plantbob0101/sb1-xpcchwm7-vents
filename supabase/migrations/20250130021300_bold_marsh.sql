/*
  # Add N/A to door coverings options

  1. Changes
    - Add 'N/A' as a valid option for door_covering in doors table
    - Add 'N/A' as a valid option for roof_covering and side_covering in vestibules table

  2. Security
    - No changes to RLS policies
*/

-- Update the check constraint for doors table
ALTER TABLE doors DROP CONSTRAINT IF EXISTS doors_door_covering_check;
ALTER TABLE doors ADD CONSTRAINT doors_door_covering_check 
CHECK (door_covering IN ('N/A', 'Poly', 'PC8', 'CPC', 'MS', 'Insect Screen'));

-- Update the check constraints for vestibules table
ALTER TABLE vestibules DROP CONSTRAINT IF EXISTS vestibules_roof_covering_check;
ALTER TABLE vestibules DROP CONSTRAINT IF EXISTS vestibules_side_covering_check;

ALTER TABLE vestibules ADD CONSTRAINT vestibules_roof_covering_check 
CHECK (roof_covering IN ('N/A', 'Poly', 'PC8', 'CPC', 'MS', 'Insect Screen'));

ALTER TABLE vestibules ADD CONSTRAINT vestibules_side_covering_check 
CHECK (side_covering IN ('N/A', 'Poly', 'PC8', 'CPC', 'MS', 'Insect Screen'));