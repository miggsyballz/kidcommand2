-- Add the missing source_file column to playlists table
ALTER TABLE playlists 
ADD COLUMN IF NOT EXISTS source_file TEXT;

-- Update existing playlists to have a default source_file value
UPDATE playlists 
SET source_file = 'manual_entry' 
WHERE source_file IS NULL;

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'playlists' 
ORDER BY ordinal_position;
