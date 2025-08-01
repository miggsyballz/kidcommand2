-- Add position column to playlists table for drag-and-drop ordering
ALTER TABLE playlists 
ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Update existing playlists with sequential positions
UPDATE playlists 
SET position = row_number 
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_number 
  FROM playlists
) as numbered 
WHERE playlists.id = numbered.id;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_playlists_position ON playlists(position);
