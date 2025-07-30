-- Insert sample playlists
INSERT INTO playlists (name, status, prompt, song_count) VALUES
  ('Morning Drive Energy', 'active', 'Create an energetic playlist for morning commutes with upbeat pop and rock songs', 25),
  ('80s Throwbacks', 'draft', 'Classic 80s hits with synth-pop and new wave vibes', 40),
  ('Late Night Vibes', 'archived', 'Chill and ambient tracks perfect for late night relaxation', 18),
  ('Workout Motivation', 'active', 'High-energy tracks to keep you motivated during workouts', 32),
  ('Study Focus', 'active', 'Instrumental and lo-fi tracks for concentration and focus', 28)
ON CONFLICT (id) DO NOTHING;
