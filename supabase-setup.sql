-- Supabase Database Setup for Setlist
-- Run this SQL in your Supabase SQL Editor

-- Create songs table
CREATE TABLE IF NOT EXISTS songs (
  id BIGSERIAL PRIMARY KEY,
  section TEXT NOT NULL,
  song TEXT NOT NULL,
  artist TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_songs_section ON songs(section);
CREATE INDEX IF NOT EXISTS idx_songs_order ON songs(section, order_index);

-- Enable Row Level Security (optional - adjust based on your needs)
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for now (adjust based on your auth needs)
-- For public read/write (no auth required):
CREATE POLICY "Allow public read" ON songs FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON songs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON songs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON songs FOR DELETE USING (true);

-- Or if you want authenticated users only, use:
-- CREATE POLICY "Allow authenticated read" ON songs FOR SELECT TO authenticated USING (true);
-- CREATE POLICY "Allow authenticated insert" ON songs FOR INSERT TO authenticated WITH CHECK (true);
-- CREATE POLICY "Allow authenticated update" ON songs FOR UPDATE TO authenticated USING (true);
-- CREATE POLICY "Allow authenticated delete" ON songs FOR DELETE TO authenticated USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_songs_updated_at BEFORE UPDATE ON songs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

