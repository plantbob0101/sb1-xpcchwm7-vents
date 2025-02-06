/*
  # Update Greenhouse Models and Configurations

  1. Changes
    - Safely updates existing greenhouse models while preserving references
    - Adds new models with unique names
    - Updates model configurations with new specifications
    - Maintains referential integrity with structure_models

  2. Data Updates
    - Renames existing models to avoid conflicts
    - Adds new configurations for each model
    - Preserves existing structure_models references
*/

-- Create a temporary table to store model mappings
CREATE TEMP TABLE model_mapping (
  old_id uuid,
  new_id uuid,
  old_name text,
  new_name text
);

-- Store existing model references
INSERT INTO model_mapping (old_id, old_name)
SELECT id, name
FROM greenhouse_models;

-- Update existing models with new names to avoid conflicts
UPDATE greenhouse_models
SET name = name || ' (Legacy)'
WHERE id IN (SELECT old_id FROM model_mapping);

-- Insert new models
WITH new_models AS (
  INSERT INTO greenhouse_models (name, description, gutter_connect)
  VALUES
    ('Solar Light Pro Max', 'Commercial greenhouse optimized for light transmission', false),
    ('Gothic Pro Elite', 'Gothic arch design optimized for snow load shedding', false),
    ('Venlo Commercial Plus', 'Dutch-style commercial greenhouse with excellent light transmission', true),
    ('Arch Classic Premium', 'Traditional quonset-style greenhouse for versatile applications', false),
    ('Elite Pro Series Max', 'Premium commercial greenhouse with advanced structural features', true)
  RETURNING id, name
)
INSERT INTO model_mapping (new_id, new_name)
SELECT id, name FROM new_models;

-- Clear existing configurations
DELETE FROM model_configurations;

-- Insert configurations for Solar Light Pro Max
WITH model AS (SELECT id FROM greenhouse_models WHERE name = 'Solar Light Pro Max')
INSERT INTO model_configurations (model_id, width, load, eave, glazing)
SELECT 
  model.id,
  width,
  load,
  eave,
  'PC8'
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

-- Insert configurations for Gothic Pro Elite
WITH model AS (SELECT id FROM greenhouse_models WHERE name = 'Gothic Pro Elite')
INSERT INTO model_configurations (model_id, width, load, eave, glazing)
SELECT 
  model.id,
  width,
  load,
  eave,
  'PC8'
FROM model,
  (VALUES
    ('21', '20', '8'),
    ('21', '20', '10'),
    ('24', '20', '10'),
    ('24', '30', '10'),
    ('24', '30', '12'),
    ('30', '30', '12'),
    ('30', '40', '14')
  ) AS configs(width, load, eave);

-- Insert configurations for Venlo Commercial Plus
WITH model AS (SELECT id FROM greenhouse_models WHERE name = 'Venlo Commercial Plus')
INSERT INTO model_configurations (model_id, width, load, eave, glazing)
SELECT 
  model.id,
  width,
  load,
  eave,
  'PC8'
FROM model,
  (VALUES
    ('24', '20', '10'),
    ('24', '20', '12'),
    ('30', '20', '12'),
    ('30', '30', '12'),
    ('30', '30', '14'),
    ('36', '30', '14'),
    ('36', '40', '16')
  ) AS configs(width, load, eave);

-- Insert configurations for Arch Classic Premium
WITH model AS (SELECT id FROM greenhouse_models WHERE name = 'Arch Classic Premium')
INSERT INTO model_configurations (model_id, width, load, eave, glazing)
SELECT 
  model.id,
  width,
  load,
  eave,
  'PC8'
FROM model,
  (VALUES
    ('18', '10', '8'),
    ('18', '20', '8'),
    ('21', '20', '8'),
    ('21', '20', '10'),
    ('24', '20', '10'),
    ('24', '30', '10')
  ) AS configs(width, load, eave);

-- Insert configurations for Elite Pro Series Max
WITH model AS (SELECT id FROM greenhouse_models WHERE name = 'Elite Pro Series Max')
INSERT INTO model_configurations (model_id, width, load, eave, glazing)
SELECT 
  model.id,
  width,
  load,
  eave,
  'PC8'
FROM model,
  (VALUES
    ('24', '30', '12'),
    ('24', '40', '12'),
    ('30', '30', '12'),
    ('30', '40', '14'),
    ('36', '40', '14'),
    ('36', '50', '16'),
    ('42', '50', '16')
  ) AS configs(width, load, eave);

-- Clean up
DROP TABLE model_mapping;