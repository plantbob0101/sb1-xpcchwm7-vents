/*
  # Rename base_angel_12ft column to base_angle_12ft

  1. Changes
    - Rename column base_angel_12ft to base_angle_12ft in structure_models table
    - Update existing data to preserve values
*/

ALTER TABLE structure_models
RENAME COLUMN base_angel_12ft TO base_angle_12ft;