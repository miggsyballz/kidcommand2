-- Drop the existing songs table if it exists
DROP TABLE IF EXISTS songs CASCADE;

-- Create the songs table with the correct columns matching our upload data
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  artist TEXT,
  genre TEXT,
  year INTEGER,
  duration TEXT,
  bpm INTEGER,
  album TEXT,
  playlist_id UUID REFERENCES playlists(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now
CREATE POLICY "Allow all operations on songs" ON songs
  FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);
CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);
CREATE INDEX IF NOT EXISTS idx_songs_genre ON songs(genre);
CREATE INDEX IF NOT EXISTS idx_songs_year ON songs(year);
CREATE INDEX IF NOT EXISTS idx_songs_playlist_id ON songs(playlist_id);

-- Insert some sample data to test
INSERT INTO songs (title, artist, genre, year, duration) VALUES
  ('Sample Song 1', 'Sample Artist 1', 'Pop', 2023, '3:45'),
  ('Sample Song 2', 'Sample Artist 2', 'Rock', 2022, '4:12'),
  ('Sample Song 3', 'Sample Artist 3', 'Hip Hop', 2024, '3:28');
