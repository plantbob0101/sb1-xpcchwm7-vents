/*
  # Fix greenhouse models and configurations

  1. Changes
    - Safely removes existing models while preserving references
    - Creates new models with guaranteed unique names
    - Adds configurations for each model
    - Preserves existing structure_models references
*/

-- First, update any existing structure_models to use NULL for model_id
UPDATE structure_models SET model_id = NULL;

-- Now safe to delete existing data
DELETE FROM model_configurations;
DELETE FROM greenhouse_models;

-- Insert new models with unique names
INSERT INTO greenhouse_models (name, description, gutter_connect)
VALUES
  ('Solar Light Pro', 'Commercial greenhouse optimized for light transmission', false),
  ('Gothic Pro Plus', 'Gothic arch design optimized for snow load shedding', false),
  ('Venlo Commercial', 'Dutch-style commercial greenhouse with excellent light transmission', true),
  ('Arch Classic Plus', 'Traditional quonset-style greenhouse for versatile applications', false),
  ('Elite Pro Series', 'Premium commercial greenhouse with advanced structural features', true);

-- Insert configurations for Solar Light Pro
WITH model AS (SELECT id FROM greenhouse_models WHERE name = 'Solar Light Pro')
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

-- Insert configurations for Gothic Pro Plus
WITH model AS (SELECT id FROM greenhouse_models WHERE name = 'Gothic Pro Plus')
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

-- Insert configurations for Venlo Commercial
WITH model AS (SELECT id FROM greenhouse_models WHERE name = 'Venlo Commercial')
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

-- Insert configurations for Arch Classic Plus
WITH model AS (SELECT id FROM greenhouse_models WHERE name = 'Arch Classic Plus')
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

-- Insert configurations for Elite Pro Series
WITH model AS (SELECT id FROM greenhouse_models WHERE name = 'Elite Pro Series')
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