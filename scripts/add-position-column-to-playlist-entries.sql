-- Add position column to playlist_entries table for drag-and-drop ordering
ALTER TABLE playlist_entries 
ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Update existing entries with sequential positions within each playlist
UPDATE playlist_entries 
SET position = row_number 
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY playlist_id ORDER BY created_at) as row_number 
  FROM playlist_entries
) as numbered 
WHERE playlist_entries.id = numbered.id;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_playlist_entries_position ON playlist_entries(playlist_id, position);
