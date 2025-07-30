-- Add any missing columns to match our component needs
ALTER TABLE playlists 
ADD COLUMN IF NOT EXISTS prompt text,
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone default now(),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone default now();

-- Add check constraint for status if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'playlists_status_check'
    ) THEN
        ALTER TABLE playlists 
        ADD CONSTRAINT playlists_status_check 
        CHECK (status IN ('active', 'draft', 'archived'));
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now
DROP POLICY IF EXISTS "Allow all operations on playlists" ON playlists;
CREATE POLICY "Allow all operations on playlists" ON playlists
  FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_playlists_status ON playlists(status);
CREATE INDEX IF NOT EXISTS idx_playlists_date_created ON playlists(date_created);
