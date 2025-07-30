-- Let's create a simple test to verify our column names work
-- First, let's see what columns actually exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'playlist_entries' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test a simple insert to verify column names
INSERT INTO playlist_entries (
  "Title", 
  "Artist", 
  "Catergory"
) VALUES (
  'Test Song', 
  'Test Artist', 
  'Test Genre'
);

-- If the above fails, try without quotes
-- INSERT INTO playlist_entries (
--   Title, 
--   Artist, 
--   Catergory
-- ) VALUES (
--   'Test Song 2', 
--   'Test Artist 2', 
--   'Test Genre 2'
-- );
