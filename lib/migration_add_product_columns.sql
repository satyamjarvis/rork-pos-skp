-- Migration to add product_columns column to business_settings if it doesn't exist
-- Run this in Supabase SQL Editor

-- Add product_columns column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'business_settings' 
    AND column_name = 'product_columns'
  ) THEN
    ALTER TABLE business_settings 
    ADD COLUMN product_columns INTEGER DEFAULT 5;
    
    RAISE NOTICE 'Column product_columns added successfully';
  ELSE
    RAISE NOTICE 'Column product_columns already exists';
  END IF;
END $$;

-- Update existing records that have NULL product_columns
UPDATE business_settings 
SET product_columns = 5 
WHERE product_columns IS NULL;

-- Verify the migration
SELECT 
  user_id, 
  name, 
  product_columns 
FROM business_settings 
ORDER BY created_at DESC 
LIMIT 10;
