-- Add color column to addon_variants table
ALTER TABLE addon_variants 
ADD COLUMN IF NOT EXISTS color TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN addon_variants.color IS 'Optional color for the variant (e.g., #EF4444 for red)';
