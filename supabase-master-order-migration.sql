-- Add global master order to songs so the "Actual Order" view is deterministic
-- Run this in Supabase SQL Editor

ALTER TABLE songs
ADD COLUMN IF NOT EXISTS master_order INTEGER NOT NULL DEFAULT 0;

-- Backfill: assign a stable order for existing rows
-- If you previously relied on (section, order_index), this keeps that relative order
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY section ASC, order_index ASC, id ASC) - 1 AS rn
  FROM songs
)
UPDATE songs s
SET master_order = ranked.rn
FROM ranked
WHERE s.id = ranked.id;

CREATE INDEX IF NOT EXISTS idx_songs_master_order ON songs(master_order);


