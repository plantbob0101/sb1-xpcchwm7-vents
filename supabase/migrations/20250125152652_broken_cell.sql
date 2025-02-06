/*
  # Initial Schema for Greenhouse Builder

  1. New Tables
    - `projects`
      - Stores project metadata like bid number and customer info
    - `categories` 
      - Main design sections (Structure, Vents, etc.)
    - `subcategories`
      - Subsections within categories
    - `options`
      - Available choices for each subcategory
    - `user_selections`
      - Captures user design choices
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  bid_number TEXT,
  customer_name TEXT,
  project_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'draft',
  notes TEXT
);

-- Categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Subcategories table
CREATE TABLE subcategories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Options table
CREATE TABLE options (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  subcategory_id uuid REFERENCES subcategories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  specifications JSONB,
  price DECIMAL(10,2),
  dependencies JSONB, -- Stores compatibility rules
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User selections table
CREATE TABLE user_selections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  subcategory_id uuid REFERENCES subcategories(id),
  option_id uuid REFERENCES options(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, subcategory_id)
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_selections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Categories are publicly readable
CREATE POLICY "Categories are readable by all users"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- Subcategories are publicly readable
CREATE POLICY "Subcategories are readable by all users"
  ON subcategories FOR SELECT
  TO authenticated
  USING (true);

-- Options are publicly readable
CREATE POLICY "Options are readable by all users"
  ON options FOR SELECT
  TO authenticated
  USING (true);

-- User selections policies
CREATE POLICY "Users can manage their own selections"
  ON user_selections FOR ALL
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

-- Insert initial categories
INSERT INTO categories (name, description, display_order, icon) VALUES
  ('Structure', 'Basic greenhouse structure and frame', 1, 'building'),
  ('Doors and Vestibules', 'Entry and access points', 2, 'door'),
  ('Vents', 'Ventilation systems and components', 3, 'wind'),
  ('Glazing', 'Covering materials and panels', 4, 'panel-top'),
  ('Heating', 'Heating systems and controls', 5, 'thermometer'),
  ('Cooling', 'Cooling and temperature management', 6, 'fan'),
  ('Energy Curtain', 'Energy conservation systems', 7, 'curtain'),
  ('Benches', 'Growing surfaces and work areas', 8, 'table'),
  ('Controls', 'Automation and control systems', 9, 'settings'),
  ('Other', 'Additional features and accessories', 10, 'plus-circle');