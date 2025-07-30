-- Update song counts for all playlists based on actual entries
UPDATE playlists 
SET song_count = (
  SELECT COUNT(*) 
  FROM playlist_entries 
  WHERE playlist_entries.playlist_id = playlists.id
);

-- Check the results
SELECT id, name, song_count, created_at, date_created 
FROM playlists 
ORDER BY created_at DESC;
