-- Fix constraint to allow all H-1B visa variants
ALTER TABLE applications DROP CONSTRAINT IF EXISTS check_visa_class;

-- Add a more flexible constraint (allows H-1B1 Chile, H-1B1 Singapore, etc.)
ALTER TABLE applications ADD CONSTRAINT check_visa_class
    CHECK (visa_class LIKE 'H-1B%' OR visa_class = 'E-3');
