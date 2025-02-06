/*
  # Fix user sharing functionality
  
  1. New Tables
    - `profiles` table to store user profile information
    - Links to auth.users via user_id
    
  2. Changes
    - Update project_shares to reference profiles instead of auth.users directly
    - Add RLS policies for profiles table
    
  3. Security
    - Enable RLS on profiles
    - Add policies for profile access
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Update project_shares to use profiles
ALTER TABLE project_shares
DROP CONSTRAINT IF EXISTS project_shares_shared_with_id_fkey,
DROP CONSTRAINT IF EXISTS project_shares_created_by_fkey;

ALTER TABLE project_shares
ADD CONSTRAINT project_shares_shared_with_id_fkey
  FOREIGN KEY (shared_with_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE,
ADD CONSTRAINT project_shares_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();