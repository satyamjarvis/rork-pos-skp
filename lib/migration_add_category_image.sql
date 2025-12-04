-- Add image_url and category_order columns to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS category_order INTEGER DEFAULT 0;

-- Add index for category_order
CREATE INDEX IF NOT EXISTS idx_categories_order ON categories(category_order);
