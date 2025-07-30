-- Clean up any sample songs that were inserted
DELETE FROM playlist_entries 
WHERE source_file IN ('sample.csv', 'manual_entry') 
   OR title LIKE 'Sample Song%'
   OR artist LIKE 'Sample Artist%';

-- Also clean up any songs that reference deleted playlists
DELETE FROM playlist_entries 
WHERE playlist_id NOT IN (SELECT id FROM playlists);

-- Verify cleanup
SELECT COUNT(*) as remaining_songs FROM playlist_entries;
SELECT COUNT(*) as remaining_playlists FROM playlists;
