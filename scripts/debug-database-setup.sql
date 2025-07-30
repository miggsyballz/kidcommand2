-- Debug and setup script for Kid Command music database
-- This script checks existing data and adds sample content if needed

-- First, let's check what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check if we have any playlists
DO $$
DECLARE
    playlist_count INTEGER;
    song_count INTEGER;
BEGIN
    -- Count existing playlists
    SELECT COUNT(*) INTO playlist_count FROM playlists;
    SELECT COUNT(*) INTO song_count FROM playlist_entries;
    
    RAISE NOTICE 'Current database state:';
    RAISE NOTICE '- Playlists: %', playlist_count;
    RAISE NOTICE '- Songs: %', song_count;
    
    -- Only add sample data if we have very little content
    IF playlist_count < 3 THEN
        RAISE NOTICE 'Adding sample playlists...';
        
        -- Insert sample playlists
        INSERT INTO playlists (name, status, song_count, source_file, created_at) VALUES
        ('Workout Mix', 'active', 0, 'Sample Data', NOW()),
        ('Chill Vibes', 'active', 0, 'Sample Data', NOW()),
        ('Party Hits', 'active', 0, 'Sample Data', NOW()),
        ('Focus Flow', 'active', 0, 'Sample Data', NOW()),
        ('Late Night', 'active', 0, 'Sample Data', NOW())
        ON CONFLICT (name) DO NOTHING;
        
        RAISE NOTICE 'Sample playlists added!';
    END IF;
    
    IF song_count < 10 THEN
        RAISE NOTICE 'Adding sample songs...';
        
        -- Get playlist IDs for sample data
        WITH playlist_ids AS (
            SELECT id, name FROM playlists WHERE source_file = 'Sample Data'
        ),
        sample_songs AS (
            SELECT * FROM (VALUES
                ('Workout Mix', 'Hip Hop', 'WM001', 'Started From The Bottom', 'Drake', 'motivational, rap, success', '3:45', 8, 2013, 8, 9, 'lead', 'urban', 85, 'track'),
                ('Workout Mix', 'Hip Hop', 'WM002', 'SICKO MODE', 'Travis Scott', 'energy, trap, workout', '5:12', 9, 2018, 9, 9, 'lead', 'trap', 155, 'track'),
                ('Workout Mix', 'Pop', 'WM003', 'Blinding Lights', 'The Weeknd', 'synthwave, energy, retro', '3:20', 8, 2019, 7, 8, 'lead', 'synth', 171, 'track'),
                ('Workout Mix', 'Hip Hop', 'WM004', 'God''s Plan', 'Drake', 'positive, rap, uplifting', '3:19', 7, 2018, 8, 8, 'lead', 'urban', 77, 'track'),
                
                ('Chill Vibes', 'R&B', 'CV001', 'Best Part', 'Daniel Caesar ft. H.E.R.', 'love, smooth, chill', '3:28', 4, 2017, 8, 5, 'lead', 'smooth', 67, 'track'),
                ('Chill Vibes', 'Indie Pop', 'CV002', 'Watermelon Sugar', 'Harry Styles', 'summer, sweet, relaxed', '2:54', 5, 2020, 8, 6, 'lead', 'organic', 95, 'track'),
                ('Chill Vibes', 'Pop', 'CV003', 'Levitating', 'Dua Lipa', 'disco, fun, groovy', '3:23', 6, 2020, 9, 7, 'lead', 'disco', 103, 'track'),
                ('Chill Vibes', 'R&B', 'CV004', 'Golden', 'Jill Scott', 'soulful, warm, love', '4:15', 5, 2004, 9, 6, 'lead', 'neo-soul', 72, 'track'),
                
                ('Party Hits', 'Pop', 'PH001', 'Don''t Start Now', 'Dua Lipa', 'dance, party, disco', '3:03', 8, 2019, 8, 8, 'lead', 'disco', 124, 'track'),
                ('Party Hits', 'Hip Hop', 'PH002', 'I Like It', 'Cardi B', 'latin, party, trap', '3:23', 9, 2018, 8, 9, 'lead', 'latin-trap', 136, 'track'),
                ('Party Hits', 'Pop', 'PH003', 'As It Was', 'Harry Styles', 'nostalgic, pop, catchy', '2:47', 6, 2022, 6, 7, 'lead', 'pop-rock', 173, 'track'),
                ('Party Hits', 'Hip Hop', 'PH004', 'Industry Baby', 'Lil Nas X ft. Jack Harlow', 'confident, party, rap', '3:32', 9, 2021, 8, 9, 'lead', 'trap', 150, 'track'),
                
                ('Focus Flow', 'Electronic', 'FF001', 'Strobe', 'Deadmau5', 'progressive, focus, electronic', '10:36', 6, 2009, 7, 6, 'lead', 'progressive', 128, 'track'),
                ('Focus Flow', 'Ambient', 'FF002', 'An Ending (Ascent)', 'Brian Eno', 'ambient, peaceful, focus', '3:15', 3, 1983, 8, 4, 'ambient', 'ambient', 60, 'track'),
                ('Focus Flow', 'Classical', 'FF003', 'Clair de Lune', 'Claude Debussy', 'classical, peaceful, piano', '4:42', 2, 1905, 9, 3, 'lead', 'classical', 72, 'track'),
                ('Focus Flow', 'Lo-Fi', 'FF004', 'Lofi Study Beat', 'ChilledCow', 'lofi, study, chill', '2:30', 4, 2020, 7, 5, 'background', 'lofi', 85, 'loop'),
                
                ('Late Night', 'R&B', 'LN001', 'Adorn', 'Miguel', 'romantic, smooth, night', '3:28', 5, 2012, 8, 6, 'lead', 'smooth', 90, 'track'),
                ('Late Night', 'Pop', 'LN002', 'Midnight City', 'M83', 'dreamy, synth, night', '4:03', 6, 2011, 7, 6, 'lead', 'synth-pop', 105, 'track'),
                ('Late Night', 'Alternative', 'LN003', 'Somebody Else', 'The 1975', 'melancholy, indie, night', '5:46', 4, 2016, 5, 5, 'lead', 'indie-pop', 85, 'track'),
                ('Late Night', 'R&B', 'LN004', 'Come Through and Chill', 'Miguel ft. J. Cole', 'chill, smooth, late night', '3:27', 4, 2017, 7, 5, 'lead', 'contemporary', 75, 'track')
            ) AS songs(playlist_name, category, uid, title, artist, keywords, runs, energy, era, mood, performance, role, sound, tempo, type)
        )
        INSERT INTO playlist_entries (
            playlist_id, Catergory, UID, Title, Artist, Keywords, Runs, 
            Energy, Era, Mood, Performnce, Role, Sound, Tempo, Type,
            -- Legacy columns for backward compatibility
            title, artist, genre, year, duration, bpm
        )
        SELECT 
            p.id,
            s.category, s.uid, s.title, s.artist, s.keywords, s.runs,
            s.energy, s.era, s.mood, s.performance, s.role, s.sound, s.tempo, s.type,
            -- Legacy columns
            s.title, s.artist, s.category, s.era, s.runs, s.tempo
        FROM sample_songs s
        JOIN playlist_ids p ON p.name = s.playlist_name;
        
        -- Update playlist song counts
        UPDATE playlists 
        SET song_count = (
            SELECT COUNT(*) 
            FROM playlist_entries 
            WHERE playlist_entries.playlist_id = playlists.id
        )
        WHERE source_file = 'Sample Data';
        
        RAISE NOTICE 'Sample songs added and playlist counts updated!';
    END IF;
    
    -- Final count
    SELECT COUNT(*) INTO playlist_count FROM playlists;
    SELECT COUNT(*) INTO song_count FROM playlist_entries;
    
    RAISE NOTICE 'Final database state:';
    RAISE NOTICE '- Playlists: %', playlist_count;
    RAISE NOTICE '- Songs: %', song_count;
    RAISE NOTICE 'Database setup complete! 🎵';
    
END $$;
