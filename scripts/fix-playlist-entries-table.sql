-- Drop the existing table if it exists and recreate with all needed columns
DROP TABLE IF EXISTS playlist_entries CASCADE;

-- Create the playlist_entries table with all required columns
CREATE TABLE playlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  artist TEXT,
  album TEXT,
  genre TEXT,
  year INTEGER,
  duration TEXT,
  bpm INTEGER,
  source_file TEXT,
  playlist_id UUID REFERENCES playlists(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE playlist_entries ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now
CREATE POLICY "Allow all operations on playlist_entries" ON playlist_entries
  FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_playlist_entries_title ON playlist_entries(title);
CREATE INDEX IF NOT EXISTS idx_playlist_entries_artist ON playlist_entries(artist);
CREATE INDEX IF NOT EXISTS idx_playlist_entries_genre ON playlist_entries(genre);
CREATE INDEX IF NOT EXISTS idx_playlist_entries_year ON playlist_entries(year);
CREATE INDEX IF NOT EXISTS idx_playlist_entries_bpm ON playlist_entries(bpm);
CREATE INDEX IF NOT EXISTS idx_playlist_entries_playlist_id ON playlist_entries(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_entries_source_file ON playlist_entries(source_file);

-- Insert some sample data to verify the table works
INSERT INTO playlist_entries (title, artist, album, genre, year, duration, bpm, source_file) VALUES
  ('Sample Song 1', 'Sample Artist 1', 'Sample Album 1', 'Pop', 2023, '3:45', 120, 'sample.csv'),
  ('Sample Song 2', 'Sample Artist 2', 'Sample Album 2', 'Rock', 2022, '4:12', 140, 'sample.csv'),
  ('Sample Song 3', 'Sample Artist 3', 'Sample Album 3', 'Hip Hop', 2024, '3:28', 95, 'sample.csv');
