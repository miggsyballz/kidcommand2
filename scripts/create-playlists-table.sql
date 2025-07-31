-- Create playlists table
CREATE TABLE IF NOT EXISTS playlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    song_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create playlist_entries table
CREATE TABLE IF NOT EXISTS playlist_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    title TEXT,
    artist TEXT,
    genre TEXT,
    year TEXT,
    duration TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for demo (allow all operations)
CREATE POLICY "Allow all operations on playlists" ON playlists FOR ALL USING (true);
CREATE POLICY "Allow all operations on playlist_entries" ON playlist_entries FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_playlist_entries_playlist_id ON playlist_entries(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_entries_title ON playlist_entries(title);
CREATE INDEX IF NOT EXISTS idx_playlist_entries_artist ON playlist_entries(artist);
CREATE INDEX IF NOT EXISTS idx_playlists_name ON playlists(name);

-- Create function to update song count
CREATE OR REPLACE FUNCTION update_playlist_song_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE playlists 
        SET song_count = (
            SELECT COUNT(*) 
            FROM playlist_entries 
            WHERE playlist_id = NEW.playlist_id
        )
        WHERE id = NEW.playlist_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE playlists 
        SET song_count = (
            SELECT COUNT(*) 
            FROM playlist_entries 
            WHERE playlist_id = OLD.playlist_id
        )
        WHERE id = OLD.playlist_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update song count
DROP TRIGGER IF EXISTS trigger_update_playlist_song_count ON playlist_entries;
CREATE TRIGGER trigger_update_playlist_song_count
    AFTER INSERT OR DELETE ON playlist_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_playlist_song_count();
