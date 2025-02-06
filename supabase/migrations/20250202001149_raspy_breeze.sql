/*
  # Fix Greenhouse Models and Configurations

  1. Changes
    - Safely handle existing structure model references
    - Update model names to avoid conflicts
    - Recreate configurations with proper relationships
    
  2. Data Updates
    - Preserve existing structure model relationships
    - Add new greenhouse models with unique names
    - Add configurations for each model
*/

-- First, create a temporary table to store existing relationships
CREATE TEMP TABLE existing_references AS
SELECT DISTINCT model_id, description_id
FROM structure_models
WHERE model_id IS NOT NULL;

-- Clear existing configurations
DELETE FROM model_configurations;

-- Remove models that aren't referenced
DELETE FROM greenhouse_models
WHERE id NOT IN (SELECT model_id FROM existing_references);

-- Update any remaining models with unique names
UPDATE greenhouse_models
SET name = name || ' (Archived)'
WHERE id IN (SELECT model_id FROM existing_references);

-- Insert new models
INSERT INTO greenhouse_models (name, description, gutter_connect)
VALUES
  ('Solar Light Series', 'Commercial greenhouse optimized for light transmission', false),
  ('Gothic Pro Series', 'Gothic arch design optimized for snow load shedding', false),
  ('Venlo Elite', 'Dutch-style commercial greenhouse with excellent light transmission', true),
  ('Arch Classic Series', 'Traditional quonset-style greenhouse for versatile applications', false),
  ('Elite Commercial Series', 'Premium commercial greenhouse with advanced structural features', true);

-- Insert configurations for Solar Light Series
WITH model AS (SELECT id FROM greenhouse_models WHERE name = 'Solar Light Series')
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

-- Insert configurations for Gothic Pro Series
WITH model AS (SELECT id FROM greenhouse_models WHERE name = 'Gothic Pro Series')
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

-- Insert configurations for Venlo Elite
WITH model AS (SELECT id FROM greenhouse_models WHERE name = 'Venlo Elite')
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

-- Insert configurations for Arch Classic Series
WITH model AS (SELECT id FROM greenhouse_models WHERE name = 'Arch Classic Series')
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

-- Insert configurations for Elite Commercial Series
WITH model AS (SELECT id FROM greenhouse_models WHERE name = 'Elite Commercial Series')
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
DROP TABLE existing_references;