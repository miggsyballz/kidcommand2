-- Debug script to analyze the current state of the database
-- This will help identify where dashboard data is coming from

-- Check if tables exist
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('playlists', 'playlist_entries', 'songs');

-- Check playlists table structure and data
SELECT 'PLAYLISTS TABLE STRUCTURE' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'playlists' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'PLAYLISTS DATA SAMPLE' as info;
SELECT 
    id,
    name,
    song_count,
    status,
    created_at,
    source_file
FROM playlists 
ORDER BY created_at DESC 
LIMIT 10;

-- Check playlist_entries table structure and data
SELECT 'PLAYLIST_ENTRIES TABLE STRUCTURE' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'playlist_entries' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'PLAYLIST_ENTRIES DATA SAMPLE' as info;
SELECT 
    id,
    playlist_id,
    source_file,
    created_at,
    CASE 
        WHEN data IS NOT NULL THEN 'Has JSON data'
        ELSE 'No JSON data'
    END as data_status
FROM playlist_entries 
ORDER BY created_at DESC 
LIMIT 10;

-- Count statistics (this is what populates the dashboard)
SELECT 'DASHBOARD STATISTICS' as info;

SELECT 
    'Total Playlists' as metric,
    COUNT(*) as value
FROM playlists
UNION ALL
SELECT 
    'Total Songs in Library' as metric,
    COUNT(*) as value
FROM playlist_entries
UNION ALL
SELECT 
    'Playlists Created This Week' as metric,
    COUNT(*) as value
FROM playlists 
WHERE created_at >= NOW() - INTERVAL '7 days'
UNION ALL
SELECT 
    'Songs Added This Month' as metric,
    COUNT(*) as value
FROM playlist_entries 
WHERE created_at >= NOW() - INTERVAL '30 days'
UNION ALL
SELECT 
    'Songs Added Today' as metric,
    COUNT(*) as value
FROM playlist_entries 
WHERE created_at >= CURRENT_DATE
UNION ALL
SELECT 
    'Songs Added This Week' as metric,
    COUNT(*) as value
FROM playlist_entries 
WHERE created_at >= NOW() - INTERVAL '7 days';

-- Recent activity data
SELECT 'RECENT PLAYLISTS FOR ACTIVITY' as info;
SELECT 
    id,
    name,
    created_at,
    'playlist_created' as activity_type
FROM playlists 
ORDER BY created_at DESC 
LIMIT 5;

-- Check for any sample data that might be causing issues
SELECT 'CHECKING FOR SAMPLE DATA' as info;
SELECT 
    COUNT(*) as sample_playlists
FROM playlists 
WHERE name ILIKE '%sample%' 
    OR name ILIKE '%test%' 
    OR name ILIKE '%demo%';

SELECT 
    COUNT(*) as sample_entries
FROM playlist_entries pe
JOIN playlists p ON pe.playlist_id = p.id
WHERE p.name ILIKE '%sample%' 
    OR p.name ILIKE '%test%' 
    OR p.name ILIKE '%demo%';

-- Check data distribution by source file
SELECT 'DATA BY SOURCE FILE' as info;
SELECT 
    source_file,
    COUNT(*) as entry_count,
    MIN(created_at) as first_upload,
    MAX(created_at) as last_upload
FROM playlist_entries 
WHERE source_file IS NOT NULL
GROUP BY source_file
ORDER BY entry_count DESC;
