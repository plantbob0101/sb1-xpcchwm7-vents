/*
  # Add Sample Drive Data

  1. New Data
    - Adds sample drive records for various vent and wall configurations
    - Includes different motor types and sizes
  2. Changes
    - Inserts initial data into drives table
*/

-- Insert sample drive data
INSERT INTO drives (drive_type, motor, size, greenhouse_type) VALUES
  ('Roof Vents', 'RW45', 12, 'Gothic'),
  ('Roof Vents', 'RW45', 24, 'Gothic'),
  ('Roof Vents', 'RW45', 36, 'Gothic'),
  ('Roof Vents', 'RW60', 48, 'Gothic'),
  ('Wall Vents', 'WV30', 12, 'All'),
  ('Wall Vents', 'WV30', 24, 'All'),
  ('Wall Vents', 'WV45', 36, 'All'),
  ('Pad Vent', 'PV30', 12, 'All'),
  ('Pad Vent', 'PV30', 24, 'All'),
  ('Pad Vent', 'PV45', 36, 'All'),
  ('RollUp Wall', 'RU30', 12, 'All'),
  ('RollUp Wall', 'RU30', 24, 'All'),
  ('RollUp Wall', 'RU45', 36, 'All'),
  ('Drop Wall', 'DW30', 12, 'All'),
  ('Drop Wall', 'DW30', 24, 'All'),
  ('Drop Wall', 'DW45', 36, 'All'),
  ('Manual Gearbox', 'MG100', 12, 'All'),
  ('Manual Gearbox', 'MG100', 24, 'All'),
  ('Manual Gearbox', 'MG200', 36, 'All'),
  ('Curtain 1212', 'C1212', 12, 'All'),
  ('Curtain 1212', 'C1212', 24, 'All'),
  ('Curtain CT/North Slope', 'CT100', 12, 'All'),
  ('Curtain CT/North Slope', 'CT100', 24, 'All'),
  ('Curtain Insulator', 'CI100', 12, 'All'),
  ('Curtain Insulator', 'CI100', 24, 'All'),
  ('Curtain Solar Light', 'CSL100', 12, 'Solar Light'),
  ('Curtain Solar Light', 'CSL100', 24, 'Solar Light');