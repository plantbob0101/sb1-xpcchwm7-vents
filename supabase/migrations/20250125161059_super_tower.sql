/*
  # Update project status field

  1. Changes
    - Add check constraint to projects table to enforce valid status values
    - Update existing status values to match new enum

  2. Notes
    - Existing statuses will be converted to 'draft' if they don't match the new values
    - New statuses: draft, in_progress, review, completed
*/

-- Update existing status values to match new enum
UPDATE projects 
SET status = 'draft' 
WHERE status NOT IN ('draft', 'in_progress', 'review', 'completed');

-- Add check constraint for status values
ALTER TABLE projects 
ADD CONSTRAINT projects_status_check 
CHECK (status IN ('draft', 'in_progress', 'review', 'completed'));