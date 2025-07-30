-- Check the actual column names in the playlist_entries table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'playlist_entries' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test insert with lowercase column names
INSERT INTO playlist_entries (
  title, 
  artist, 
  genre
) VALUES (
  'Test Song', 
  'Test Artist', 
  'Test Genre'
);
