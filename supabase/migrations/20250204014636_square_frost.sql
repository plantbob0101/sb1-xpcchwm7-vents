/*
  # Add Vent and Drive Tables

  1. New Tables
    - Creates tables for vents, drives, configurations and freight requirements
  2. Security
    - Enables RLS on all tables
    - Adds policies for access control
  3. Indexes
    - Creates indexes for better query performance
*/

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Drives are readable by authenticated users" ON drives;
DROP POLICY IF EXISTS "Drives are manageable by admin users" ON drives;

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS drives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_type text NOT NULL CHECK (
    drive_type IN (
      'Curtain 1212',
      'Curtain CT/North Slope',
      'Curtain Insulator',
      'Curtain Solar Light',
      'Drop Wall',
      'Manual Gearbox',
      'Pad Vent',
      'RollUp Wall',
      'Roof Vents',
      'Wall Vents'
    )
  ),
  motor text,
  size numeric NOT NULL,
  greenhouse_type text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vent_configurations table
CREATE TABLE IF NOT EXISTS vent_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Common fields
  configuration_type text NOT NULL CHECK (
    configuration_type IN ('Vent', 'Roll Up Wall - Endwall', 'Roll Up Wall - Sidewall', 'Drop Wall')
  ),
  
  -- Vent specific fields
  vent_id uuid REFERENCES vents(id),
  vent_quantity integer,
  vent_length numeric,
  ati_house boolean,
  
  -- Roll Up Wall - Endwall specific fields
  endwall_type text CHECK (endwall_type IN ('Guttered', 'Quonset')),
  system_quantity integer,
  houses_wide_per_system integer,
  house_width integer CHECK (
    house_width IN (18, 21, 24, 27, 30, 35, 36, 42, 48, 50)
  ),
  frame_height integer CHECK (frame_height IN (8, 10, 12, 14)),
  
  -- Roll Up Wall - Sidewall specific fields
  sidewall_type text CHECK (sidewall_type IN ('Guttered', 'Quonset')),
  eave_height integer,
  ns30 boolean,
  spacing integer CHECK (spacing IN (4, 6, 10, 12)),
  
  -- Common optional fields
  gearbox_pocket text,
  simu_winch text,
  ridder_mount_guttered text,
  ridder_mount_quonset text,
  notes text,
  
  -- Drop Wall specific fields
  braking_winch_with_mount text,
  additional_corner_bracket text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create screen_configurations table
CREATE TABLE IF NOT EXISTS screen_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vent_configuration_id uuid REFERENCES vent_configurations(id) ON DELETE CASCADE,
  screen_id uuid REFERENCES screens(id),
  screen_type text NOT NULL,
  calculated_quantity numeric,
  slitting_fee numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create drive_configurations table
CREATE TABLE IF NOT EXISTS drive_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vent_configuration_id uuid REFERENCES vent_configurations(id) ON DELETE CASCADE,
  drive_id uuid REFERENCES drives(id),
  quantity integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create freight_requirements table for vents
CREATE TABLE IF NOT EXISTS vent_freight_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vent_configuration_id uuid REFERENCES vent_configurations(id) ON DELETE CASCADE,
  drives_freight text,
  screen_freight text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(vent_configuration_id)
);

-- Enable Row Level Security
ALTER TABLE drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE vent_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE screen_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vent_freight_requirements ENABLE ROW LEVEL SECURITY;

-- Create new policies with unique names
CREATE POLICY "drives_read_access"
  ON drives FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "drives_admin_access"
  ON drives FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- Create policies for vent_configurations
CREATE POLICY "vent_config_access"
  ON vent_configurations
  FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Create policies for screen_configurations
CREATE POLICY "screen_config_access"
  ON screen_configurations
  FOR ALL
  TO authenticated
  USING (
    vent_configuration_id IN (
      SELECT id FROM vent_configurations 
      WHERE project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    vent_configuration_id IN (
      SELECT id FROM vent_configurations 
      WHERE project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  );

-- Create policies for drive_configurations
CREATE POLICY "drive_config_access"
  ON drive_configurations
  FOR ALL
  TO authenticated
  USING (
    vent_configuration_id IN (
      SELECT id FROM vent_configurations 
      WHERE project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    vent_configuration_id IN (
      SELECT id FROM vent_configurations 
      WHERE project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  );

-- Create policies for vent_freight_requirements
CREATE POLICY "vent_freight_access"
  ON vent_freight_requirements
  FOR ALL
  TO authenticated
  USING (
    vent_configuration_id IN (
      SELECT id FROM vent_configurations 
      WHERE project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    vent_configuration_id IN (
      SELECT id FROM vent_configurations 
      WHERE project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vent_configurations_project_id ON vent_configurations(project_id);
CREATE INDEX IF NOT EXISTS idx_screen_configurations_vent_configuration_id ON screen_configurations(vent_configuration_id);
CREATE INDEX IF NOT EXISTS idx_drive_configurations_vent_configuration_id ON drive_configurations(vent_configuration_id);
CREATE INDEX IF NOT EXISTS idx_vent_freight_requirements_vent_configuration_id ON vent_freight_requirements(vent_configuration_id);