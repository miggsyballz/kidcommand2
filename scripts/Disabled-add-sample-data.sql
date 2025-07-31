-- This file is disabled to prevent accidental sample data insertion
-- To enable, rename to add-sample-data.sql

-- Sample data for testing the music dashboard
-- This creates realistic music library entries for testing

INSERT INTO playlist_entries (playlist_id, data) VALUES 
(1, '{
  "Title": "Sunset Dreams",
  "Artist": "Mig Productions",
  "Genre": "Hip Hop",
  "BPM": "85",
  "Key": "C Minor",
  "Duration": "3:24",
  "Energy": "Medium",
  "Mood": "Chill",
  "Tags": "sunset, dreams, chill, hip hop"
}'),
(1, '{
  "Title": "City Lights",
  "Artist": "MaxxBeats",
  "Genre": "Trap",
  "BPM": "140",
  "Key": "F# Minor",
  "Duration": "2:58",
  "Energy": "High",
  "Mood": "Energetic",
  "Tags": "city, lights, trap, energy"
}'),
(1, '{
  "Title": "Midnight Vibes",
  "Artist": "Mig",
  "Genre": "R&B",
  "BPM": "72",
  "Key": "A Minor",
  "Duration": "4:12",
  "Energy": "Low",
  "Mood": "Romantic",
  "Tags": "midnight, vibes, r&b, smooth"
}'),
(1, '{
  "Title": "Radio Ready",
  "Artist": "Kid Command",
  "Genre": "Pop",
  "BPM": "120",
  "Key": "G Major",
  "Duration": "3:45",
  "Energy": "High",
  "Mood": "Upbeat",
  "Tags": "radio, ready, pop, commercial"
}'),
(1, '{
  "Title": "Beat Drop",
  "Artist": "Mig Productions",
  "Genre": "EDM",
  "BPM": "128",
  "Key": "D Minor",
  "Duration": "3:33",
  "Energy": "Very High",
  "Mood": "Intense",
  "Tags": "beat, drop, edm, festival"
}');

-- Add some entries to a second playlist for variety
INSERT INTO playlist_entries (playlist_id, data) VALUES 
(2, '{
  "Title": "Morning Coffee",
  "Artist": "MaxxBeats Studio",
  "Genre": "Jazz",
  "BPM": "95",
  "Key": "Bb Major",
  "Duration": "4:01",
  "Energy": "Medium",
  "Mood": "Relaxed",
  "Tags": "morning, coffee, jazz, smooth"
}'),
(2, '{
  "Title": "Workout Anthem",
  "Artist": "Mig",
  "Genre": "Hip Hop",
  "BPM": "150",
  "Key": "E Minor",
  "Duration": "3:18",
  "Energy": "Very High",
  "Mood": "Motivational",
  "Tags": "workout, anthem, motivation, energy"
}');
