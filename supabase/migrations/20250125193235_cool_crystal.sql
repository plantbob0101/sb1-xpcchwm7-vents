/*
  # Add Structure Subcategories

  1. New Data
    - Add subcategories for the Structure category
    - Link subcategories to the main category
    - Add initial options for each subcategory

  2. Changes
    - Insert subcategories for structure configuration
    - Add sample options for each subcategory
*/

-- Get the Structure category ID
DO $$ 
DECLARE
  structure_id uuid;
BEGIN
  SELECT id INTO structure_id FROM categories WHERE name = 'Structure';

  -- Insert subcategories
  INSERT INTO subcategories (category_id, name, description, display_order) VALUES
    (structure_id, 'Model Configuration', 'Configure the basic structure model', 1);

  -- Get the subcategory ID
  WITH subcategory AS (
    SELECT id FROM subcategories 
    WHERE category_id = structure_id 
    AND name = 'Model Configuration'
    LIMIT 1
  )
  INSERT INTO options (subcategory_id, name, description, specifications, price)
  SELECT 
    subcategory.id,
    spec.name,
    spec.description,
    spec.specifications,
    spec.price
  FROM subcategory,
  (VALUES
    (
      'Standard Greenhouse',
      'Basic greenhouse structure with customizable dimensions',
      jsonb_build_object(
        'width_options', ARRAY['18 ft', '21 ft', '24 ft', '30 ft'],
        'load_options', ARRAY['10 PSF', '20 PSF', '30 PSF'],
        'glazing_options', ARRAY['Single Layer', 'Double Layer', 'Triple Layer'],
        'eave_options', ARRAY['8 ft', '10 ft', '12 ft', '14 ft']
      ),
      0.00
    ),
    (
      'Premium Greenhouse',
      'Enhanced greenhouse structure with advanced features',
      jsonb_build_object(
        'width_options', ARRAY['24 ft', '30 ft'],
        'load_options', ARRAY['20 PSF', '30 PSF'],
        'glazing_options', ARRAY['Double Layer', 'Triple Layer'],
        'eave_options', ARRAY['10 ft', '12 ft', '14 ft']
      ),
      0.00
    )
  ) AS spec(name, description, specifications, price);
END $$;