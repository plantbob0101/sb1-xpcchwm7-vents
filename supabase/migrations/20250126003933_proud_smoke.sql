/*
  # Add Greenhouse Model Management

  1. Changes
    - Add admin flag to users table
    - Add management policies for greenhouse models
    - Add management policies for model configurations
    - Remove sample data

  2. Security
    - Only admin users can manage models and configurations
    - Regular users can only read models and configurations
*/

-- Add admin flag to users if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE auth.users 
    ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Remove existing policies
DROP POLICY IF EXISTS "Greenhouse models are readable by authenticated users" ON greenhouse_models;
DROP POLICY IF EXISTS "Model configurations are readable by authenticated users" ON model_configurations;

-- Clear existing sample data
DELETE FROM model_configurations;
DELETE FROM greenhouse_models;

-- Create new policies for greenhouse_models
CREATE POLICY "Models are readable by authenticated users"
  ON greenhouse_models FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Models are manageable by admin users"
  ON greenhouse_models FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'is_admin' = 'true')
  WITH CHECK (auth.jwt() ->> 'is_admin' = 'true');

-- Create new policies for model_configurations
CREATE POLICY "Configurations are readable by authenticated users"
  ON model_configurations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Configurations are manageable by admin users"
  ON model_configurations FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'is_admin' = 'true')
  WITH CHECK (auth.jwt() ->> 'is_admin' = 'true');