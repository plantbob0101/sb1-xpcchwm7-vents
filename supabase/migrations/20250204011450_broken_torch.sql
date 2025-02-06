-- Check and create tables if they don't exist
DO $$ 
BEGIN
  -- Create drives table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'drives') THEN
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
  END IF;

  -- Create vent_configurations table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'vent_configurations') THEN
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
  END IF;

  -- Create screen_configurations table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'screen_configurations') THEN
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
  END IF;

  -- Create drive_configurations table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'drive_configurations') THEN
    CREATE TABLE drive_configurations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      vent_configuration_id uuid REFERENCES vent_configurations(id) ON DELETE CASCADE,
      drive_id uuid REFERENCES drives(id),
      quantity integer NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;

  -- Create vent_freight_requirements table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'vent_freight_requirements') THEN
    CREATE TABLE vent_freight_requirements (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      vent_configuration_id uuid REFERENCES vent_configurations(id) ON DELETE CASCADE,
      drives_freight text,
      screen_freight text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      UNIQUE(vent_configuration_id)
    );
  END IF;
END $$;

-- Enable Row Level Security for new tables
DO $$ 
BEGIN
  -- Enable RLS for drives if it exists
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'drives') THEN
    ALTER TABLE drives ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Enable RLS for vent_configurations if it exists
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'vent_configurations') THEN
    ALTER TABLE vent_configurations ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Enable RLS for screen_configurations if it exists
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'screen_configurations') THEN
    ALTER TABLE screen_configurations ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Enable RLS for drive_configurations if it exists
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'drive_configurations') THEN
    ALTER TABLE drive_configurations ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Enable RLS for vent_freight_requirements if it exists
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'vent_freight_requirements') THEN
    ALTER TABLE vent_freight_requirements ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create or replace policies
DO $$ 
BEGIN
  -- Policies for drives
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'drives') THEN
    DROP POLICY IF EXISTS "Drives are readable by authenticated users" ON drives;
    DROP POLICY IF EXISTS "Drives are manageable by admin users" ON drives;
    
    CREATE POLICY "Drives are readable by authenticated users"
      ON drives FOR SELECT
      TO authenticated
      USING (true);

    CREATE POLICY "Drives are manageable by admin users"
      ON drives FOR ALL
      TO authenticated
      USING (auth.is_admin())
      WITH CHECK (auth.is_admin());
  END IF;

  -- Policies for vent_configurations
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'vent_configurations') THEN
    DROP POLICY IF EXISTS "Users can manage their own vent configurations" ON vent_configurations;
    
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
  END IF;

  -- Policies for screen_configurations
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'screen_configurations') THEN
    DROP POLICY IF EXISTS "Users can manage their own screen configurations" ON screen_configurations;
    
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
  END IF;

  -- Policies for drive_configurations
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'drive_configurations') THEN
    DROP POLICY IF EXISTS "Users can manage their own drive configurations" ON drive_configurations;
    
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
  END IF;

  -- Policies for vent_freight_requirements
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'vent_freight_requirements') THEN
    DROP POLICY IF EXISTS "Users can manage their own vent freight requirements" ON vent_freight_requirements;
    
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
  END IF;
END $$;

-- Create indexes for better query performance
DO $$
BEGIN
  -- Create index for vent_configurations if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'vent_configurations' 
    AND indexname = 'idx_vent_configurations_project_id'
  ) THEN
    CREATE INDEX idx_vent_configurations_project_id 
    ON vent_configurations(project_id);
  END IF;

  -- Create index for screen_configurations if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'screen_configurations' 
    AND indexname = 'idx_screen_configurations_vent_configuration_id'
  ) THEN
    CREATE INDEX idx_screen_configurations_vent_configuration_id 
    ON screen_configurations(vent_configuration_id);
  END IF;

  -- Create index for drive_configurations if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'drive_configurations' 
    AND indexname = 'idx_drive_configurations_vent_configuration_id'
  ) THEN
    CREATE INDEX idx_drive_configurations_vent_configuration_id 
    ON drive_configurations(vent_configuration_id);
  END IF;

  -- Create index for vent_freight_requirements if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'vent_freight_requirements' 
    AND indexname = 'idx_vent_freight_requirements_vent_configuration_id'
  ) THEN
    CREATE INDEX idx_vent_freight_requirements_vent_configuration_id 
    ON vent_freight_requirements(vent_configuration_id);
  END IF;
END $$;