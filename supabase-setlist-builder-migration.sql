-- Supabase Database Migration for Set List Builder Feature
-- Run this SQL in your Supabase SQL Editor

-- Create custom_setlists table to store named setlists
CREATE TABLE IF NOT EXISTS custom_setlists (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create custom_setlist_songs table to store songs in each custom setlist
CREATE TABLE IF NOT EXISTS custom_setlist_songs (
  id BIGSERIAL PRIMARY KEY,
  setlist_id BIGINT NOT NULL REFERENCES custom_setlists(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  song TEXT NOT NULL,
  artist TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  CONSTRAINT fk_setlist FOREIGN KEY (setlist_id) REFERENCES custom_setlists(id) ON DELETE CASCADE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_custom_setlists_name ON custom_setlists(name);
CREATE INDEX IF NOT EXISTS idx_custom_setlist_songs_setlist_id ON custom_setlist_songs(setlist_id);
CREATE INDEX IF NOT EXISTS idx_custom_setlist_songs_order ON custom_setlist_songs(setlist_id, order_index);

-- Enable Row Level Security
ALTER TABLE custom_setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_setlist_songs ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all operations for public access (same as songs table)
CREATE POLICY "Allow public read custom_setlists" ON custom_setlists FOR SELECT USING (true);
CREATE POLICY "Allow public insert custom_setlists" ON custom_setlists FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update custom_setlists" ON custom_setlists FOR UPDATE USING (true);
CREATE POLICY "Allow public delete custom_setlists" ON custom_setlists FOR DELETE USING (true);

CREATE POLICY "Allow public read custom_setlist_songs" ON custom_setlist_songs FOR SELECT USING (true);
CREATE POLICY "Allow public insert custom_setlist_songs" ON custom_setlist_songs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update custom_setlist_songs" ON custom_setlist_songs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete custom_setlist_songs" ON custom_setlist_songs FOR DELETE USING (true);

-- Create trigger to auto-update updated_at for custom_setlists
CREATE TRIGGER update_custom_setlists_updated_at BEFORE UPDATE ON custom_setlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Optional: If you want to restrict to authenticated users only, use:
-- DROP POLICY "Allow public read custom_setlists" ON custom_setlists;
-- CREATE POLICY "Allow authenticated read custom_setlists" ON custom_setlists FOR SELECT TO authenticated USING (true);
-- CREATE POLICY "Allow authenticated insert custom_setlists" ON custom_setlists FOR INSERT TO authenticated WITH CHECK (true);
-- CREATE POLICY "Allow authenticated update custom_setlists" ON custom_setlists FOR UPDATE TO authenticated USING (true);
-- CREATE POLICY "Allow authenticated delete custom_setlists" ON custom_setlists FOR DELETE TO authenticated USING (true);
-- (Repeat for custom_setlist_songs table)

