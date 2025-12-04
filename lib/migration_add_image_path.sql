-- Migration to add image_path column to products and categories
-- This replaces the public URL system with a path-based system using signed URLs

-- Add image_path to products table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'image_path'
  ) THEN
    ALTER TABLE products 
    ADD COLUMN image_path TEXT;
    
    RAISE NOTICE 'Column image_path added to products successfully';
  ELSE
    RAISE NOTICE 'Column image_path already exists in products';
  END IF;
END $$;

-- Add image_path to categories table (in addition to existing image_url for backwards compatibility)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'categories' 
    AND column_name = 'image_path'
  ) THEN
    ALTER TABLE categories 
    ADD COLUMN image_path TEXT;
    
    RAISE NOTICE 'Column image_path added to categories successfully';
  ELSE
    RAISE NOTICE 'Column image_path already exists in categories';
  END IF;
END $$;

-- Migrate existing image_url to image_path
-- Extract the path from public URLs if they exist
UPDATE products 
SET image_path = SUBSTRING(image_url FROM 'product-images/(.*)$')
WHERE image_url IS NOT NULL 
  AND image_url LIKE '%product-images/%'
  AND image_path IS NULL;

UPDATE categories 
SET image_path = SUBSTRING(image_url FROM 'product-images/(.*)$')
WHERE image_url IS NOT NULL 
  AND image_url LIKE '%product-images/%'
  AND image_path IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_products_image_path ON products(image_path);
CREATE INDEX IF NOT EXISTS idx_categories_image_path ON categories(image_path);

-- Verify the migration
SELECT 
  'products' as table_name,
  COUNT(*) as total_rows,
  COUNT(image_url) as with_image_url,
  COUNT(image_path) as with_image_path
FROM products
UNION ALL
SELECT 
  'categories' as table_name,
  COUNT(*) as total_rows,
  COUNT(image_url) as with_image_url,
  COUNT(image_path) as with_image_path
FROM categories;
