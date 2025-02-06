/*
  # Add Structure Model Configuration Tables

  1. New Tables
    - `greenhouse_models`: Stores predefined greenhouse models (e.g., "Solar Light")
    - `model_configurations`: Stores valid combinations for each model
  
  2. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Create greenhouse_models table
CREATE TABLE greenhouse_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create model_configurations table for valid combinations
CREATE TABLE model_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES greenhouse_models(id) ON DELETE CASCADE,
  width text NOT NULL,
  load text NOT NULL,
  eave text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(model_id, width, load, eave)
);

-- Enable RLS
ALTER TABLE greenhouse_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_configurations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Greenhouse models are readable by authenticated users"
  ON greenhouse_models FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Model configurations are readable by authenticated users"
  ON model_configurations FOR SELECT
  TO authenticated
  USING (true);

-- Insert sample data for Solar Light model
INSERT INTO greenhouse_models (name, description) VALUES
  ('Solar Light', 'Commercial greenhouse optimized for light transmission');

-- Insert valid configurations for Solar Light
WITH model AS (SELECT id FROM greenhouse_models WHERE name = 'Solar Light')
INSERT INTO model_configurations (model_id, width, load, eave)
SELECT 
  model.id,
  width,
  load,
  eave
FROM model,
  (VALUES
    ('18', '10', '8'),
    ('18', '10', '10'),
    ('21', '10', '8'),
    ('21', '10', '10'),
    ('21', '20', '10'),
    ('24', '20', '10'),
    ('24', '20', '12'),
    ('24', '30', '12'),
    ('30', '30', '12'),
    ('30', '30', '14')
  ) AS configs(width, load, eave);