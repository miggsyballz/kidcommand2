-- Migrate playlist_entries to JSONB-based data structure
DO $$
BEGIN
  -- Add `data` column if not present
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'playlist_entries' 
    AND column_name = 'data'
  ) THEN
    ALTER TABLE playlist_entries ADD COLUMN data JSONB;
    CREATE INDEX IF NOT EXISTS idx_playlist_entries_data 
      ON playlist_entries USING GIN (data);
  END IF;

  -- Add `column_structure` to playlists if not present
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'playlists' 
    AND column_name = 'column_structure'
  ) THEN
    ALTER TABLE playlists ADD COLUMN column_structure TEXT;
  END IF;

  -- Migrate legacy fields into `data` JSONB object
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'playlist_entries' 
    AND column_name = 'title'
  ) THEN
    UPDATE playlist_entries 
    SET data = jsonb_build_object(
      'Title', COALESCE(title, ''),
      'Artist', COALESCE(artist, ''),
      'Genre', COALESCE(genre, ''),
      'Year', COALESCE(year, ''),
      'Duration', COALESCE(duration, ''),
      'Keywords', COALESCE(keywords, ''),
      'Runs', COALESCE(runs, ''),
      'Performance', COALESCE(performnce, ''),
      'Era', COALESCE(era, ''),
      'Mood', COALESCE(mood, ''),
      'Energy', COALESCE(energy, ''),
      'Role', COALESCE(role, ''),
      'Sound', COALESCE(sound, ''),
      'Tempo', COALESCE(tempo, ''),
      'Type', COALESCE(type, ''),
      'Category', COALESCE(catergory, ''),
      'UID', COALESCE(uid, ''),
      'BPM', COALESCE(bpm, ''),
      'Album', COALESCE(album, '')
    )
    WHERE data IS NULL;

    -- Drop all old flat columns
    ALTER TABLE playlist_entries DROP COLUMN IF EXISTS title;
    ALTER TABLE playlist_entries DROP COLUMN IF EXISTS artist;
    ALTER TABLE playlist_entries DROP COLUMN IF EXISTS genre;
    ALTER TABLE playlist_entries DROP COLUMN IF EXISTS year;
    ALTER TABLE playlist_entries DROP COLUMN IF EXISTS duration;
    ALTER TABLE playlist_entries DROP COLUMN IF EXISTS keywords;
    ALTER TABLE playlist_entries DROP COLUMN IF EXISTS runs;
    ALTER TABLE playlist_entries DROP COLUMN IF EXISTS performnce;
    ALTER TABLE playlist_entries DROP COLUMN IF EXISTS era;
    ALTER TABLE playlist_entries DROP COLUMN IF EXISTS mood;
    ALTER TABLE playlist_entries DROP COLUMN IF EXISTS energy;
    ALTER TABLE playlist_entries DROP COLUMN IF EXISTS role;
    ALTER TABLE playlist_entries DROP COLUMN IF EXISTS sound;
    ALTER TABLE playlist_entries DROP COLUMN IF EXISTS tempo;
    ALTER TABLE playlist_entries DROP COLUMN IF EXISTS type;
    ALTER TABLE playlist_entries DROP COLUMN IF EXISTS catergory;
    ALTER TABLE playlist_entries DROP COLUMN IF EXISTS uid;
    ALTER TABLE playlist_entries DROP COLUMN IF EXISTS bpm;
    ALTER TABLE playlist_entries DROP COLUMN IF EXISTS album;
  END IF;
END $$;

-- Add `source_file` if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'playlist_entries' 
    AND column_name = 'source_file'
  ) THEN
    ALTER TABLE playlist_entries ADD COLUMN source_file TEXT;
  END IF;
END $$;

-- Clean up invalid rows with non-object JSON
DELETE FROM playlist_entries 
WHERE data IS NOT NULL 
  AND jsonb_typeof(data) != 'object';

-- Ensure `song_count` column exists in playlists table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'playlists' 
    AND column_name = 'song_count'
  ) THEN
    ALTER TABLE playlists ADD COLUMN song_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Recalculate song count for each playlist
UPDATE playlists
SET song_count = (
  SELECT COUNT(*) FROM playlist_entries 
  WHERE playlist_entries.playlist_id = playlists.id
)
WHERE song_count IS NULL OR song_count = 0;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_playlist_entries_playlist_id 
  ON playlist_entries(playlist_id);

CREATE INDEX IF NOT EXISTS idx_playlist_entries_source_file 
  ON playlist_entries(source_file);

CREATE INDEX IF NOT EXISTS idx_playlist_entries_created_at 
  ON playlist_entries(created_at);

-- Enforce required fields
ALTER TABLE playlist_entries 
  ALTER COLUMN playlist_id SET NOT NULL;

-- Remove orphaned playlist entries
DELETE FROM playlist_entries 
WHERE playlist_id NOT IN (
  SELECT id FROM playlists
);
