-- Remove playlists that were auto-generated from sample data
-- Keep only manually created playlists

-- First, let's see what playlists exist
SELECT id, name, source_file, created_at 
FROM playlists 
ORDER BY created_at;

-- Delete playlists that look like they were auto-generated
-- (You can modify this query based on what you see in the results above)

-- Delete sample playlists by name
DELETE FROM playlists 
WHERE name IN (
  'Morning Drive Energy',
  '80s Throwbacks', 
  'Late Night Vibes',
  'Workout Motivation',
  'Study Focus'
);

-- Or delete playlists that don't have a source_file (indicating they were manually inserted)
-- DELETE FROM playlists WHERE source_file IS NULL OR source_file = 'manual_entry';

-- Or delete playlists created before a certain date (adjust the date as needed)
-- DELETE FROM playlists WHERE created_at < '2024-01-01';

-- Verify what's left
SELECT id, name, source_file, song_count, created_at 
FROM playlists 
ORDER BY created_at;
