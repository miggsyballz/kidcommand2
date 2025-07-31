-- Remove the album column that doesn't exist in the schema
-- This script ensures the playlist_entries table only has the correct columns

-- Check current columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'playlist_entries' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- The table should have these columns:
-- id, title, artist, album, genre, year, duration, bpm, source_file, playlist_id, created_at, updated_at
-- Plus the spreadsheet-style columns: Catergory, UID, Title, Artist, Keywords, Runs, Performnce, Era, Mood, Energy, Role, Sound, Tempo, Type

-- If album column doesn't exist, this is just a verification script
-- The upload component has been fixed to not reference the album column
