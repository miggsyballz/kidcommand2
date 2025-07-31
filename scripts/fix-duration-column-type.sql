-- Fix duration column type to store as integer (seconds)
-- This script will convert existing duration data and change column type

-- First, let's check the current column type
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'playlist_entries' AND column_name = 'duration';

-- If duration is currently text/varchar, we need to convert it
-- Create a backup of existing data first
CREATE TABLE IF NOT EXISTS playlist_entries_backup AS 
SELECT * FROM playlist_entries;

-- Add a temporary column for the conversion
ALTER TABLE playlist_entries ADD COLUMN duration_temp INTEGER;

-- Convert existing duration values to seconds
UPDATE playlist_entries 
SET duration_temp = CASE 
  -- Handle mm:ss format (e.g., "3:45" -> 225 seconds)
  WHEN duration ~ '^[0-9]+:[0-9]{2}$' THEN 
    CAST(SPLIT_PART(duration, ':', 1) AS INTEGER) * 60 + 
    CAST(SPLIT_PART(duration, ':', 2) AS INTEGER)
  
  -- Handle plain numbers (already in seconds)
  WHEN duration ~ '^[0-9]+$' THEN 
    CAST(duration AS INTEGER)
  
  -- Handle decimal fractions (Excel time format)
  WHEN duration ~ '^0\.[0-9]+$' THEN 
    ROUND(CAST(duration AS DECIMAL) * 24 * 60 * 60)
  
  -- Default to NULL for invalid formats
  ELSE NULL
END
WHERE duration IS NOT NULL AND duration != '';

-- Drop the old duration column
ALTER TABLE playlist_entries DROP COLUMN duration;

-- Rename the temp column to duration
ALTER TABLE playlist_entries RENAME COLUMN duration_temp TO duration;

-- Verify the conversion worked
SELECT 
  title, 
  artist, 
  duration,
  CASE 
    WHEN duration IS NOT NULL THEN 
      LPAD((duration / 60)::text, 2, '0') || ':' || LPAD((duration % 60)::text, 2, '0')
    ELSE NULL 
  END as formatted_duration
FROM playlist_entries 
WHERE duration IS NOT NULL 
LIMIT 10;

-- Clean up backup table (uncomment if conversion looks good)
-- DROP TABLE playlist_entries_backup;
