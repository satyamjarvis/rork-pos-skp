-- VIKTIG: Kjør denne SQL-en i Supabase SQL Editor
-- Denne legger til image_path kolonnen i både products og categories tabellen

-- Legg til image_path i products tabellen hvis den ikke eksisterer
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS image_path TEXT;

-- Legg til image_path i categories tabellen hvis den ikke eksisterer  
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS image_path TEXT;

-- Sjekk at kolonnene er lagt til
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name IN ('products', 'categories') 
  AND column_name = 'image_path'
  AND table_schema = 'public';

-- Vis resultat til bruker
SELECT 'image_path kolonner lagt til i både products og categories tabeller!' AS status;