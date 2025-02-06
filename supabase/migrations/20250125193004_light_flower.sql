/*
  # Add Structure Model Tables

  1. New Tables
    - `structure_models`
      - Main table for structure configurations
      - Stores range, house, and length values
    - `structure_specifications`
      - Lookup table for predefined specifications
      - Stores width, load, glazing, and eave options

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create structure_specifications table for predefined options
CREATE TABLE structure_specifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'width', 'load', 'glazing', 'eave'
  value TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(type, value)
);

-- Create structure_models table
CREATE TABLE structure_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  width_id uuid REFERENCES structure_specifications(id),
  load_id uuid REFERENCES structure_specifications(id),
  glazing_id uuid REFERENCES structure_specifications(id),
  eave_id uuid REFERENCES structure_specifications(id),
  range_count INTEGER NOT NULL,
  house_count INTEGER NOT NULL,
  house_length DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE structure_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE structure_models ENABLE ROW LEVEL SECURITY;

-- Create policies for structure_specifications
CREATE POLICY "Structure specifications are readable by authenticated users"
  ON structure_specifications
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Structure specifications are insertable by authenticated users"
  ON structure_specifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for structure_models
CREATE POLICY "Structure models are readable by authenticated users"
  ON structure_models
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Structure models are insertable by authenticated users"
  ON structure_models
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Structure models are updatable by authenticated users"
  ON structure_models
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Structure models are deletable by authenticated users"
  ON structure_models
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert initial specification values
INSERT INTO structure_specifications (type, value, display_order) VALUES
  -- Width options
  ('width', '18 ft', 1),
  ('width', '21 ft', 2),
  ('width', '24 ft', 3),
  ('width', '30 ft', 4),
  -- Load options
  ('load', '10 PSF', 1),
  ('load', '20 PSF', 2),
  ('load', '30 PSF', 3),
  -- Glazing options
  ('glazing', 'Single Layer', 1),
  ('glazing', 'Double Layer', 2),
  ('glazing', 'Triple Layer', 3),
  -- Eave options
  ('eave', '8 ft', 1),
  ('eave', '10 ft', 2),
  ('eave', '12 ft', 3),
  ('eave', '14 ft', 4);