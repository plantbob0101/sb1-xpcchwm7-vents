/*
  # Create admin role and fix model permissions

  1. Changes
    - Create admin role
    - Update RLS policies for greenhouse_models and model_configurations
    - Add admin user function
  
  2. Security
    - Enable RLS
    - Add policies for admin and regular users
*/

-- Create admin role
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN coalesce(
    current_setting('request.jwt.claims', true)::json->>'is_admin',
    'false'
  )::boolean;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update greenhouse_models policies
DROP POLICY IF EXISTS "Models are readable by authenticated users" ON greenhouse_models;
DROP POLICY IF EXISTS "Models are manageable by admin users" ON greenhouse_models;

CREATE POLICY "Models are readable by all users"
  ON greenhouse_models FOR SELECT
  USING (true);

CREATE POLICY "Models are manageable by admin users"
  ON greenhouse_models FOR ALL
  USING (auth.is_admin() = true)
  WITH CHECK (auth.is_admin() = true);

-- Update model_configurations policies
DROP POLICY IF EXISTS "Configurations are readable by authenticated users" ON model_configurations;
DROP POLICY IF EXISTS "Configurations are manageable by admin users" ON model_configurations;

CREATE POLICY "Configurations are readable by all users"
  ON model_configurations FOR SELECT
  USING (true);

CREATE POLICY "Configurations are manageable by admin users"
  ON model_configurations FOR ALL
  USING (auth.is_admin() = true)
  WITH CHECK (auth.is_admin() = true);

-- Function to make a user an admin
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