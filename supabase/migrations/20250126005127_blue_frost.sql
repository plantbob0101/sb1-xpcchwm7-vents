/*
  # Fix admin policies for greenhouse models

  1. Changes
    - Update admin check function
    - Simplify RLS policies
    - Add direct admin check
  
  2. Security
    - Enable RLS
    - Simplified policies for better reliability
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Models are readable by all users" ON greenhouse_models;
DROP POLICY IF EXISTS "Models are manageable by admin users" ON greenhouse_models;
DROP POLICY IF EXISTS "Configurations are readable by all users" ON model_configurations;
DROP POLICY IF EXISTS "Configurations are manageable by admin users" ON model_configurations;

-- Update admin check function
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (current_setting('request.jwt.claims', true)::jsonb->>'raw_app_meta_data')::jsonb->>'is_admin' = 'true';
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

CREATE POLICY "Enable insert for admins"
  ON greenhouse_models FOR INSERT
  TO authenticated
  WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb->>'raw_app_meta_data')::jsonb->>'is_admin' = 'true');

CREATE POLICY "Enable update for admins"
  ON greenhouse_models FOR UPDATE
  TO authenticated
  USING ((current_setting('request.jwt.claims', true)::jsonb->>'raw_app_meta_data')::jsonb->>'is_admin' = 'true')
  WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb->>'raw_app_meta_data')::jsonb->>'is_admin' = 'true');

CREATE POLICY "Enable delete for admins"
  ON greenhouse_models FOR DELETE
  TO authenticated
  USING ((current_setting('request.jwt.claims', true)::jsonb->>'raw_app_meta_data')::jsonb->>'is_admin' = 'true');

-- Simplified policies for model_configurations
CREATE POLICY "Enable read access for all users"
  ON model_configurations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for admins"
  ON model_configurations FOR INSERT
  TO authenticated
  WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb->>'raw_app_meta_data')::jsonb->>'is_admin' = 'true');

CREATE POLICY "Enable update for admins"
  ON model_configurations FOR UPDATE
  TO authenticated
  USING ((current_setting('request.jwt.claims', true)::jsonb->>'raw_app_meta_data')::jsonb->>'is_admin' = 'true')
  WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb->>'raw_app_meta_data')::jsonb->>'is_admin' = 'true');

CREATE POLICY "Enable delete for admins"
  ON model_configurations FOR DELETE
  TO authenticated
  USING ((current_setting('request.jwt.claims', true)::jsonb->>'raw_app_meta_data')::jsonb->>'is_admin' = 'true');

-- Update admin function to be more reliable
CREATE OR REPLACE FUNCTION make_user_admin(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    '{"is_admin": true}'::jsonb
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;