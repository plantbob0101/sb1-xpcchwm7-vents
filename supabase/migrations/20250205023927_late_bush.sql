-- Add screen_width column to screen_configurations table
ALTER TABLE screen_configurations
ADD COLUMN screen_width text;

-- Update existing records to use first width from screens table
UPDATE screen_configurations sc
SET screen_width = (
  SELECT width[1]::text
  FROM screens s
  WHERE s.id = sc.screen_id
)
WHERE screen_width IS NULL;