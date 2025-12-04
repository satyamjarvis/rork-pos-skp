-- Migration to add product_order column to products table
-- Run this in Supabase SQL Editor
-- NOTE: You need to run each block separately in Supabase SQL Editor

-- STEP 1: Add product_order column if it doesn't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS product_order INTEGER;

-- STEP 2: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_product_order ON products(product_order);

-- STEP 3: Set default order based on created_at for existing products
-- Run this as a separate query after STEP 1 and 2
UPDATE products p1
SET product_order = (
  SELECT COUNT(*) 
  FROM products p2 
  WHERE p2.user_id = p1.user_id 
  AND p2.created_at < p1.created_at
)
WHERE product_order IS NULL;

-- STEP 4: Verify the migration (optional)
SELECT 
  user_id,
  name,
  product_order,
  created_at
FROM products 
ORDER BY user_id, product_order 
LIMIT 20;
