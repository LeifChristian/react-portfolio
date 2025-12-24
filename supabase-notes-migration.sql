-- Supabase Database Migration for Notes/Chat Feature
-- Run this SQL in your Supabase SQL Editor after the initial setup

-- Create notes/messages table
CREATE TABLE IF NOT EXISTS notes (
  id BIGSERIAL PRIMARY KEY,
  user_name TEXT NOT NULL CHECK (user_name IN ('Collin', 'Leif', 'Ryland')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create index for faster queries (ordered by creation time)
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);

-- Enable Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for public access (same as songs table)
CREATE POLICY "Allow public read notes" ON notes FOR SELECT USING (true);
CREATE POLICY "Allow public insert notes" ON notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update notes" ON notes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete notes" ON notes FOR DELETE USING (true);

-- Optional: If you want to restrict to authenticated users only, use:
-- CREATE POLICY "Allow authenticated read notes" ON notes FOR SELECT TO authenticated USING (true);
-- CREATE POLICY "Allow authenticated insert notes" ON notes FOR INSERT TO authenticated WITH CHECK (true);
-- CREATE POLICY "Allow authenticated update notes" ON notes FOR UPDATE TO authenticated USING (true);
-- CREATE POLICY "Allow authenticated delete notes" ON notes FOR DELETE TO authenticated USING (true);

