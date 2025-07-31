-- Clean up all sample data from the database
-- This removes all the sample songs and playlists that were inserted during setup

-- First, remove playlist entries that reference sample songs
DELETE FROM playlist_entries 
WHERE song_id IN (
  SELECT id FROM songs 
  WHERE title IN (
    'Good as Hell', 'Uptown Funk', 'Take On Me', 'Sweet Dreams', 'Billie Jean',
    'Like a Prayer', 'I Want It That Way', 'Teardrop', 'Angel', 'Porcelain',
    'Lose Yourself', 'Stan', 'Without Me', 'Smells Like Teen Spirit', 'Come As You Are',
    'In Bloom', 'Bohemian Rhapsody', 'We Will Rock You', 'Another One Bites the Dust',
    'Imagine', 'Hey Jude', 'Let It Be', 'Hotel California', 'Stairway to Heaven',
    'Sweet Child O Mine', 'Thunderstruck', 'Back in Black', 'Highway to Hell',
    'Dancing Queen', 'Mamma Mia', 'Fernando', 'Waterloo', 'SOS', 'Money Money Money',
    'I Will Survive', 'Le Freak', 'Good Times', 'Stayin Alive', 'Night Fever',
    'How Deep Is Your Love', 'More Than a Feeling', 'Peace of Mind', 'Foreplay/Long Time',
    'Dont Stop Believin', 'Any Way You Want It', 'Open Arms', 'Separate Ways',
    'Faithfully', 'Wheel in the Sky'
  )
);

-- Remove sample playlists
DELETE FROM playlists 
WHERE name IN (
  'Morning Drive Energy', '80s Throwbacks', 'Late Night Vibes', 'Workout Motivation',
  'Study Focus', 'Pop Hits Collection', 'Rock Classics', 'Hip Hop Essentials',
  'Electronic Vibes', 'Indie Discoveries', 'Country Roads', 'Jazz Standards',
  'Classical Masterpieces', 'Reggae Rhythms', 'Blues Foundation', 'Folk Tales',
  'Punk Power', 'Metal Mayhem', 'Disco Fever', 'Funk Grooves'
);

-- Remove sample songs
DELETE FROM songs 
WHERE title IN (
  'Good as Hell', 'Uptown Funk', 'Take On Me', 'Sweet Dreams', 'Billie Jean',
  'Like a Prayer', 'I Want It That Way', 'Teardrop', 'Angel', 'Porcelain',
  'Lose Yourself', 'Stan', 'Without Me', 'Smells Like Teen Spirit', 'Come As You Are',
  'In Bloom', 'Bohemian Rhapsody', 'We Will Rock You', 'Another One Bites the Dust',
  'Imagine', 'Hey Jude', 'Let It Be', 'Hotel California', 'Stairway to Heaven',
  'Sweet Child O Mine', 'Thunderstruck', 'Back in Black', 'Highway to Hell',
  'Dancing Queen', 'Mamma Mia', 'Fernando', 'Waterloo', 'SOS', 'Money Money Money',
  'I Will Survive', 'Le Freak', 'Good Times', 'Stayin Alive', 'Night Fever',
  'How Deep Is Your Love', 'More Than a Feeling', 'Peace of Mind', 'Foreplay/Long Time',
  'Dont Stop Believin', 'Any Way You Want It', 'Open Arms', 'Separate Ways',
  'Faithfully', 'Wheel in the Sky'
);

-- Clean up any orphaned playlist entries (entries that reference non-existent songs or playlists)
DELETE FROM playlist_entries 
WHERE song_id NOT IN (SELECT id FROM songs)
   OR playlist_id NOT IN (SELECT id FROM playlists);

-- Update playlist song counts to reflect the cleanup
UPDATE playlists 
SET song_count = (
  SELECT COUNT(*) 
  FROM playlist_entries 
  WHERE playlist_entries.playlist_id = playlists.id
);

-- Show cleanup results
SELECT 'Cleanup completed successfully' as status;
SELECT COUNT(*) as remaining_songs FROM songs;
SELECT COUNT(*) as remaining_playlists FROM playlists;
SELECT COUNT(*) as remaining_playlist_entries FROM playlist_entries;
