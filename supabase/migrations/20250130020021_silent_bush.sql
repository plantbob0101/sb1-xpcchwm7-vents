/*
  # Doors and Vestibules Schema

  1. New Tables
    - door_types: Stores available door types and sizes
    - doors_and_vestibules: Main container for project's doors and vestibules
    - doors: Individual door configurations
    - vestibules: Vestibule configurations
    - freight_requirements: Shipping requirements

  2. Security
    - Enable RLS on all tables
    - Door types are readable by all authenticated users
    - Door types are manageable by admin users
    - Other tables are manageable by project owners
*/

-- Create door_types table
CREATE TABLE door_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  size text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add check constraint for door types
ALTER TABLE door_types
ADD CONSTRAINT door_types_type_check 
CHECK (type IN ('Hinged', 'Inside Sliding', 'Outside Sliding', 'Door Jamb Kit'));

-- Create doors_and_vestibules table
CREATE TABLE doors_and_vestibules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create doors table
CREATE TABLE doors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doors_and_vestibules_id uuid REFERENCES doors_and_vestibules(id) ON DELETE CASCADE,
  door_type_id uuid REFERENCES door_types(id),
  door_covering text,
  quantity integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add check constraints for doors
ALTER TABLE doors
ADD CONSTRAINT doors_door_covering_check 
CHECK (door_covering IN ('Poly', 'PC8', 'CPC', 'MS', 'Insect Screen')),
ADD CONSTRAINT doors_quantity_check 
CHECK (quantity > 0);

-- Create vestibules table
CREATE TABLE vestibules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doors_and_vestibules_id uuid REFERENCES doors_and_vestibules(id) ON DELETE CASCADE,
  dimensions text NOT NULL,
  roof_covering text,
  side_covering text,
  door_id uuid REFERENCES doors(id),
  pressure_fan text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add check constraints for vestibules
ALTER TABLE vestibules
ADD CONSTRAINT vestibules_roof_covering_check 
CHECK (roof_covering IN ('Poly', 'PC8', 'CPC', 'MS', 'Insect Screen')),
ADD CONSTRAINT vestibules_side_covering_check 
CHECK (side_covering IN ('Poly', 'PC8', 'CPC', 'MS', 'Insect Screen'));

-- Create freight_requirements table
CREATE TABLE freight_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doors_and_vestibules_id uuid REFERENCES doors_and_vestibules(id) ON DELETE CASCADE,
  aj_door_freight text,
  glazing_freight text,
  screen_freight text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(doors_and_vestibules_id)
);

-- Enable Row Level Security
ALTER TABLE door_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE doors_and_vestibules ENABLE ROW LEVEL SECURITY;
ALTER TABLE doors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vestibules ENABLE ROW LEVEL SECURITY;
ALTER TABLE freight_requirements ENABLE ROW LEVEL SECURITY;

-- Create policies for door_types
CREATE POLICY "Door types are readable by authenticated users"
  ON door_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Door types are manageable by admin users"
  ON door_types FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- Create policies for doors_and_vestibules
CREATE POLICY "Users can manage their own doors and vestibules"
  ON doors_and_vestibules
  FOR ALL
  TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- Create policies for doors
CREATE POLICY "Users can manage doors for their projects"
  ON doors
  FOR ALL
  TO authenticated
  USING (
    doors_and_vestibules_id IN (
      SELECT id FROM doors_and_vestibules 
      WHERE project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    doors_and_vestibules_id IN (
      SELECT id FROM doors_and_vestibules 
      WHERE project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  );

-- Create policies for vestibules
CREATE POLICY "Users can manage vestibules for their projects"
  ON vestibules
  FOR ALL
  TO authenticated
  USING (
    doors_and_vestibules_id IN (
      SELECT id FROM doors_and_vestibules 
      WHERE project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    doors_and_vestibules_id IN (
      SELECT id FROM doors_and_vestibules 
      WHERE project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  );

-- Create policies for freight_requirements
CREATE POLICY "Users can manage freight requirements for their projects"
  ON freight_requirements
  FOR ALL
  TO authenticated
  USING (
    doors_and_vestibules_id IN (
      SELECT id FROM doors_and_vestibules 
      WHERE project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    doors_and_vestibules_id IN (
      SELECT id FROM doors_and_vestibules 
      WHERE project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_doors_and_vestibules_project_id ON doors_and_vestibules(project_id);
CREATE INDEX idx_doors_doors_and_vestibules_id ON doors(doors_and_vestibules_id);
CREATE INDEX idx_vestibules_doors_and_vestibules_id ON vestibules(doors_and_vestibules_id);
CREATE INDEX idx_freight_requirements_doors_and_vestibules_id ON freight_requirements(doors_and_vestibules_id);

-- Insert sample door types
INSERT INTO door_types (type, size) VALUES
  ('Hinged', '3'' x 7'''),
  ('Hinged', '4'' x 8'''),
  ('Inside Sliding', '4'' x 8'''),
  ('Inside Sliding', '6'' x 8'''),
  ('Outside Sliding', '4'' x 8'''),
  ('Outside Sliding', '6'' x 8'''),
  ('Door Jamb Kit', '3'' x 7'''),
  ('Door Jamb Kit', '4'' x 8''');