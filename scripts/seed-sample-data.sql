-- Insert sample playlists
INSERT INTO playlists (name, status, prompt, song_count) VALUES
  ('Morning Drive Energy', 'active', 'Create an energetic playlist for morning commutes with upbeat pop and rock songs', 25),
  ('80s Throwbacks', 'draft', 'Classic 80s hits with synth-pop and new wave vibes', 40),
  ('Late Night Vibes', 'archived', 'Chill and ambient tracks perfect for late night relaxation', 18),
  ('Workout Motivation', 'active', 'High-energy tracks to keep you motivated during workouts', 32),
  ('Study Focus', 'active', 'Instrumental and lo-fi tracks for concentration and focus', 28);

-- Insert sample songs for the first playlist
INSERT INTO songs (title, artist, year, genre, duration, bpm, playlist_id) 
SELECT 
  'Good as Hell', 'Lizzo', 2019, 'Pop', '3:31', 128,
  (SELECT id FROM playlists WHERE name = 'Morning Drive Energy' LIMIT 1)
UNION ALL SELECT 
  'Uptown Funk', 'Mark Ronson ft. Bruno Mars', 2014, 'Funk', '4:30', 115,
  (SELECT id FROM playlists WHERE name = 'Morning Drive Energy' LIMIT 1)
UNION ALL SELECT 
  'Can''t Stop the Feeling!', 'Justin Timberlake', 2016, 'Pop', '3:56', 113,
  (SELECT id FROM playlists WHERE name = 'Morning Drive Energy' LIMIT 1);

-- Insert sample songs for the 80s playlist
INSERT INTO songs (title, artist, year, genre, duration, bpm, playlist_id) 
SELECT 
  'Take On Me', 'a-ha', 1985, 'Synth-pop', '3:47', 169,
  (SELECT id FROM playlists WHERE name = '80s Throwbacks' LIMIT 1)
UNION ALL SELECT 
  'Sweet Dreams', 'Eurythmics', 1983, 'New Wave', '3:36', 132,
  (SELECT id FROM playlists WHERE name = '80s Throwbacks' LIMIT 1)
UNION ALL SELECT 
  'Don''t You (Forget About Me)', 'Simple Minds', 1985, 'New Wave', '4:20', 110,
  (SELECT id FROM playlists WHERE name = '80s Throwbacks' LIMIT 1);
