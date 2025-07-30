-- Add the spreadsheet-style columns that the editor expects
ALTER TABLE playlist_entries 
ADD COLUMN IF NOT EXISTS "Catergory" TEXT,
ADD COLUMN IF NOT EXISTS "UID" TEXT,
ADD COLUMN IF NOT EXISTS "Title" TEXT,
ADD COLUMN IF NOT EXISTS "Artist" TEXT,
ADD COLUMN IF NOT EXISTS "Keywords" TEXT,
ADD COLUMN IF NOT EXISTS "Runs" TEXT,
ADD COLUMN IF NOT EXISTS "Performnce" INTEGER,
ADD COLUMN IF NOT EXISTS "Era" INTEGER,
ADD COLUMN IF NOT EXISTS "Mood" INTEGER,
ADD COLUMN IF NOT EXISTS "Energy" INTEGER,
ADD COLUMN IF NOT EXISTS "Role" TEXT,
ADD COLUMN IF NOT EXISTS "Sound" TEXT,
ADD COLUMN IF NOT EXISTS "Tempo" INTEGER,
ADD COLUMN IF NOT EXISTS "Type" TEXT;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'playlist_entries' 
AND table_schema = 'public'
ORDER BY ordinal_position;
