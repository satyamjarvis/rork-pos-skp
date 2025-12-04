-- VIKTIG: Kjør denne SQL-en i Supabase SQL Editor
-- Denne legger til manglende kolonner i categories og products tabellene

-- 1. Legg til image_url, image_path og category_order kolonner i categories hvis de ikke eksisterer
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS image_path TEXT,
ADD COLUMN IF NOT EXISTS category_order INTEGER DEFAULT 0;

-- 2. Legg til product_order, image_path og sizes kolonner i products hvis de ikke eksisterer
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS product_order INTEGER,
ADD COLUMN IF NOT EXISTS image_path TEXT,
ADD COLUMN IF NOT EXISTS sizes JSONB;

-- 3. Legg til indexes for bedre ytelse
CREATE INDEX IF NOT EXISTS idx_categories_order ON categories(category_order);
CREATE INDEX IF NOT EXISTS idx_products_product_order ON products(product_order);

-- 4. Sett default order basert på created_at for eksisterende produkter
UPDATE products p1
SET product_order = (
  SELECT COUNT(*) 
  FROM products p2 
  WHERE p2.user_id = p1.user_id 
  AND p2.created_at < p1.created_at
)
WHERE product_order IS NULL;

-- 5. Sett default order for kategorier basert på created_at
UPDATE categories c1
SET category_order = (
  SELECT COUNT(*) 
  FROM categories c2 
  WHERE c2.user_id = c1.user_id 
  AND c2.created_at < c1.created_at
)
WHERE category_order IS NULL OR category_order = 0;

-- 6. Vis resultatet til bruker
SELECT 'Migration completed! Alle kolonner lagt til.' AS status;
