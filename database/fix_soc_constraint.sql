-- Fix SOC code constraint to handle corrupted data from older files
-- (Excel converted codes like "11-51" to "Nov-51")

ALTER TABLE occupations DROP CONSTRAINT IF EXISTS check_major_group;

-- Make major_group more flexible (allow any 2-character code, including corrupted ones)
-- We'll clean this in post-processing if needed
