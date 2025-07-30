-- Create the playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  song_count INTEGER DEFAULT 0,
  date_created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT CHECK (status IN ('active', 'draft', 'archived')) DEFAULT 'draft',
  prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the songs table
CREATE TABLE IF NOT EXISTS songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  year INTEGER,
  genre TEXT,
  duration TEXT,
  bpm INTEGER,
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on playlists" ON playlists
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on songs" ON songs
  FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_playlists_status ON playlists(status);
CREATE INDEX IF NOT EXISTS idx_playlists_date_created ON playlists(date_created);
CREATE INDEX IF NOT EXISTS idx_songs_playlist_id ON songs(playlist_id);
CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);
CREATE INDEX IF NOT EXISTS idx_songs_genre ON songs(genre);

-- Create a function to update song_count automatically
CREATE OR REPLACE FUNCTION update_playlist_song_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE playlists 
    SET song_count = (SELECT COUNT(*) FROM songs WHERE playlist_id = NEW.playlist_id)
    WHERE id = NEW.playlist_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE playlists 
    SET song_count = (SELECT COUNT(*) FROM songs WHERE playlist_id = OLD.playlist_id)
    WHERE id = OLD.playlist_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update song_count
CREATE TRIGGER trigger_update_song_count_insert
  AFTER INSERT ON songs
  FOR EACH ROW
  EXECUTE FUNCTION update_playlist_song_count();

CREATE TRIGGER trigger_update_song_count_delete
  AFTER DELETE ON songs
  FOR EACH ROW
  EXECUTE FUNCTION update_playlist_song_count();
