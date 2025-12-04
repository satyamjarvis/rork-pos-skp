-- Migration to add sizes and has_size columns to products table
-- Run this in Supabase SQL Editor

-- Add sizes column (JSONB to store array of size objects)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'sizes'
  ) THEN
    ALTER TABLE products 
    ADD COLUMN sizes JSONB DEFAULT '[]'::jsonb;
    
    RAISE NOTICE 'Column sizes added successfully';
  ELSE
    RAISE NOTICE 'Column sizes already exists';
  END IF;
END $$;

-- Add has_size column (BOOLEAN to indicate if product has sizes)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'has_size'
  ) THEN
    ALTER TABLE products 
    ADD COLUMN has_size BOOLEAN DEFAULT FALSE;
    
    RAISE NOTICE 'Column has_size added successfully';
  ELSE
    RAISE NOTICE 'Column has_size already exists';
  END IF;
END $$;

-- Update existing records that have NULL sizes
UPDATE products 
SET sizes = '[]'::jsonb 
WHERE sizes IS NULL;

-- Update existing records that have NULL has_size
UPDATE products 
SET has_size = FALSE 
WHERE has_size IS NULL;

-- Verify the migration
SELECT 
  id,
  name,
  sizes,
  has_size
FROM products 
ORDER BY created_at DESC 
LIMIT 10;
