-- Create the playlist_entries table for uploaded data
CREATE TABLE IF NOT EXISTS playlist_entries (
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
CREATE INDEX IF NOT EXISTS idx_playlist_entries_playlist_id ON playlist_entries(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_entries_source_file ON playlist_entries(source_file);
