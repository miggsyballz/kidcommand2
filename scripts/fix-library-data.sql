-- Check what data we actually have
SELECT 
  COUNT(*) as total_entries,
  COUNT(CASE WHEN "Title" IS NOT NULL AND "Title" != '' THEN 1 END) as entries_with_title,
  COUNT(CASE WHEN title IS NOT NULL AND title != '' THEN 1 END) as entries_with_lowercase_title
FROM playlist_entries;

-- Check sample data to see what columns have data
SELECT 
  id,
  "Title", title,
  "Artist", artist, 
  "Catergory", genre,
  playlist_id,
  created_at
FROM playlist_entries 
LIMIT 5;

-- Update spreadsheet columns from legacy columns if they're empty
UPDATE playlist_entries 
SET 
  "Title" = COALESCE(NULLIF("Title", ''), title),
  "Artist" = COALESCE(NULLIF("Artist", ''), artist),
  "Catergory" = COALESCE(NULLIF("Catergory", ''), genre),
  "Era" = COALESCE("Era", year),
  "Runs" = COALESCE(NULLIF("Runs", ''), duration),
  "Tempo" = COALESCE("Tempo", bpm)
WHERE 
  ("Title" IS NULL OR "Title" = '') OR
  ("Artist" IS NULL OR "Artist" = '') OR
  ("Catergory" IS NULL OR "Catergory" = '');

-- Verify the update
SELECT 
  COUNT(*) as total_entries,
  COUNT(CASE WHEN "Title" IS NOT NULL AND "Title" != '' THEN 1 END) as entries_with_title,
  COUNT(CASE WHEN "Artist" IS NOT NULL AND "Artist" != '' THEN 1 END) as entries_with_artist
FROM playlist_entries;
