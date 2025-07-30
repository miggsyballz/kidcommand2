-- Check the actual column names in the playlist_entries table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'playlist_entries' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check if the table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'playlist_entries';
