# ⚠️ VIKTIG: Database-migrasjon kreves!

## Problem
Du får feilmeldinger når du prøver å oppdatere produkter og kategorier:
- ❌ "Kunne ikke oppdatere produkt"
- ❌ "Kunne ikke oppdatere kategori"

## Årsak
Databasen mangler viktige kolonner som trengs for å lagre bilder og rekkefølge:
- `image_url` - for å lagre bildelenker
- `category_order` - for å lagre kategorirekkefølge

## Løsning: Kjør migrasjonen

### Steg 1: Åpne Supabase Dashboard
1. Gå til [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Velg prosjektet ditt: **cgwqicgtxsgrmxyzdjzx**

### Steg 2: Åpne SQL Editor
1. Klikk på **"SQL Editor"** i venstremenyen
2. Klikk på **"New query"**

### Steg 3: Kopier og kjør SQL-koden
Åpne filen `lib/RUN_THIS_MIGRATION.sql` og kopier hele innholdet.

Eller kopier denne koden direkte:

```sql
-- VIKTIG: Kjør denne SQL-en i Supabase SQL Editor
-- Denne legger til manglende kolonner i categories tabellen

-- Legg til image_url og category_order kolonner hvis de ikke eksisterer
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS category_order INTEGER DEFAULT 0;

-- Legg til index for category_order hvis den ikke eksisterer
CREATE INDEX IF NOT EXISTS idx_categories_order ON categories(category_order);

-- Sjekk at kolonnene er lagt til (denne skal returnere begge kolonnene)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'categories' 
AND column_name IN ('image_url', 'category_order');

-- Vis resultatet til bruker
SELECT 'Migration completed! Kolonner lagt til.' AS status;
```

### Steg 4: Kjør koden
1. Lim inn SQL-koden i editoren
2. Klikk på **"Run"** (eller trykk Ctrl+Enter / Cmd+Enter)
3. Du skal se meldingen: **"Migration completed! Kolonner lagt til."**

### Steg 5: Test appen
Etter at migrasjonen er kjørt:
1. Last inn appen på nytt (refresh)
2. Prøv å oppdatere et produkt med bilde
3. Prøv å oppdatere en kategori med bilde
4. Prøv å endre rekkefølgen på kategorier

## Hvorfor skjedde dette?
Databasen din ble opprettet med den gamle strukturen som ikke hadde støtte for bilder på kategorier. Migrasjonen legger til de nye kolonnene uten å påvirke eksisterende data.

## Hva gjør migrasjonen?
✅ Legger til `image_url` kolonnen i `categories` tabellen
✅ Legger til `category_order` kolonnen i `categories` tabellen
✅ Oppretter index for raskere sortering av kategorier
✅ Sjekker at alt er lagt til korrekt

## Spørsmål?
Hvis du fortsatt får feil etter å ha kjørt migrasjonen:
1. Sjekk console-loggen i appen (trykk F12 i nettleseren)
2. Kopier feilmeldingen
3. Si fra, så hjelper jeg deg videre!
