/*
  # Add Gutter Connect field to greenhouse models

  1. Changes
    - Add gutter_connect boolean column to greenhouse_models table with default false
*/

ALTER TABLE greenhouse_models
ADD COLUMN gutter_connect boolean DEFAULT false;