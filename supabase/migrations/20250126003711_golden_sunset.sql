/*
  # Add Additional Greenhouse Models

  1. New Data
    - Add multiple greenhouse models with their configurations
    - Each model has specific valid combinations of width, load, and eave height
  
  2. Models Added:
    - Gothic Pro
    - Venlo
    - Arch Classic
    - Elite Series
*/

-- Insert new greenhouse models
INSERT INTO greenhouse_models (name, description) VALUES
  ('Gothic Pro', 'Gothic arch design optimized for snow load shedding'),
  ('Venlo', 'Dutch-style commercial greenhouse with excellent light transmission'),
  ('Arch Classic', 'Traditional quonset-style greenhouse for versatile applications'),
  ('Elite Series', 'Premium commercial greenhouse with advanced structural features');

-- Insert configurations for Gothic Pro
WITH model AS (SELECT id FROM greenhouse_models WHERE name = 'Gothic Pro')
INSERT INTO model_configurations (model_id, width, load, eave)
SELECT 
  model.id,
  width,
  load,
  eave
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

-- Insert configurations for Venlo
WITH model AS (SELECT id FROM greenhouse_models WHERE name = 'Venlo')
INSERT INTO model_configurations (model_id, width, load, eave)
SELECT 
  model.id,
  width,
  load,
  eave
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

-- Insert configurations for Arch Classic
WITH model AS (SELECT id FROM greenhouse_models WHERE name = 'Arch Classic')
INSERT INTO model_configurations (model_id, width, load, eave)
SELECT 
  model.id,
  width,
  load,
  eave
FROM model,
  (VALUES
    ('18', '10', '8'),
    ('18', '20', '8'),
    ('21', '20', '8'),
    ('21', '20', '10'),
    ('24', '20', '10'),
    ('24', '30', '10')
  ) AS configs(width, load, eave);

-- Insert configurations for Elite Series
WITH model AS (SELECT id FROM greenhouse_models WHERE name = 'Elite Series')
INSERT INTO model_configurations (model_id, width, load, eave)
SELECT 
  model.id,
  width,
  load,
  eave
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