/*
  # Fix admin policies for greenhouse models

  1. Changes
    - Update admin check function to use correct JWT path
    - Simplify RLS policies
    - Add direct admin check using raw_app_meta_data
  
  2. Security
    - Enable RLS
    - Simplified policies for better reliability
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON greenhouse_models;
DROP POLICY IF EXISTS "Enable insert for admins" ON greenhouse_models;
DROP POLICY IF EXISTS "Enable update for admins" ON greenhouse_models;
DROP POLICY IF EXISTS "Enable delete for admins" ON greenhouse_models;
DROP POLICY IF EXISTS "Enable read access for all users" ON model_configurations;
DROP POLICY IF EXISTS "Enable insert for admins" ON model_configurations;
DROP POLICY IF EXISTS "Enable update for admins" ON model_configurations;
DROP POLICY IF EXISTS "Enable delete for admins" ON model_configurations;

-- Update admin check function to use correct JWT path
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Get the raw_app_meta_data from the JWT claims
  RETURN coalesce(
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' -> 'is_admin')::text,
    'false'
  )::boolean;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simplified policies for greenhouse_models
CREATE POLICY "Enable read access for all users"
  ON greenhouse_models FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable write access for admins"
  ON greenhouse_models FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- Simplified policies for model_configurations
CREATE POLICY "Enable read access for all users"
  ON model_configurations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable write access for admins"
  ON model_configurations FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- Update admin function to use app_metadata
CREATE OR REPLACE FUNCTION make_user_admin(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    '{"is_admin": true}'::jsonb,
    app_metadata = 
    COALESCE(app_metadata, '{}'::jsonb) || 
    '{"is_admin": true}'::jsonb
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;