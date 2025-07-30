-- Check the actual column structure of playlist_entries table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'playlist_entries' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check if we have the spreadsheet-style columns
SELECT COUNT(*) as has_catergory FROM information_schema.columns 
WHERE table_name = 'playlist_entries' 
AND column_name = 'Catergory';

SELECT COUNT(*) as has_title_case FROM information_schema.columns 
WHERE table_name = 'playlist_entries' 
AND column_name = 'Title';
