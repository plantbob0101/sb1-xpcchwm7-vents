/*
  # Create Vents Category Tables

  1. New Tables
    - `vents` - Base table for vent types and configurations
    - `drives` - Drive types and specifications
    - `screens` - Screen products and pricing
    - `vent_configurations` - Main configuration table for all vent types

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add admin-only policies for management tables

  3. Changes
    - Create all required tables with proper relationships
    - Add check constraints for enums
    - Create indexes for better performance
*/

-- Create vents table
CREATE TABLE vents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('CT Roof', 'Gothic Roof', 'Insulator Roof', 'Oxnard Vent', 'Pad', 'Solar Light Roof', 'Wall')),
  single_double text NOT NULL CHECK (single_double IN ('Single', 'Double')),
  size integer NOT NULL,
  vent_glazing text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create drives table
CREATE TABLE drives (
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

-- Create screens table
CREATE TABLE screens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product text NOT NULL,
  width numeric[] NOT NULL,
  net_price_0_5k numeric NOT NULL,
  net_price_5k_20k numeric NOT NULL,
  net_price_20k_plus numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vent_configurations table
CREATE TABLE vent_configurations (
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

-- Create screen_configurations table for "Set for Screen" sections
CREATE TABLE screen_configurations (
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
CREATE TABLE drive_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vent_configuration_id uuid REFERENCES vent_configurations(id) ON DELETE CASCADE,
  drive_id uuid REFERENCES drives(id),
  quantity integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create freight_requirements table for vents
CREATE TABLE vent_freight_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vent_configuration_id uuid REFERENCES vent_configurations(id) ON DELETE CASCADE,
  drives_freight text,
  screen_freight text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(vent_configuration_id)
);

-- Enable Row Level Security
ALTER TABLE vents ENABLE ROW LEVEL SECURITY;
ALTER TABLE drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE vent_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE screen_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vent_freight_requirements ENABLE ROW LEVEL SECURITY;

-- Create policies for vents table
CREATE POLICY "Vents are readable by authenticated users"
  ON vents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Vents are manageable by admin users"
  ON vents FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- Create policies for drives table
CREATE POLICY "Drives are readable by authenticated users"
  ON drives FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Drives are manageable by admin users"
  ON drives FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- Create policies for screens table
CREATE POLICY "Screens are readable by authenticated users"
  ON screens FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Screens are manageable by admin users"
  ON screens FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- Create policies for vent_configurations
CREATE POLICY "Users can manage their own vent configurations"
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
CREATE POLICY "Users can manage their own screen configurations"
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
CREATE POLICY "Users can manage their own drive configurations"
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
CREATE POLICY "Users can manage their own vent freight requirements"
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
CREATE INDEX idx_vent_configurations_project_id ON vent_configurations(project_id);
CREATE INDEX idx_screen_configurations_vent_configuration_id ON screen_configurations(vent_configuration_id);
CREATE INDEX idx_drive_configurations_vent_configuration_id ON drive_configurations(vent_configuration_id);
CREATE INDEX idx_vent_freight_requirements_vent_configuration_id ON vent_freight_requirements(vent_configuration_id);