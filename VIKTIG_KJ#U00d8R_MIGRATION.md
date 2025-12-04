# VIKTIG: Database Migration Påkrevd

## Problemet
Du får feilmeldingen:
```
column products.product_order does not exist
```

Dette skyldes at database-tabellene mangler noen kolonner som appen trenger.

## Løsningen

Du må kjøre en database migration i Supabase.

### Steg-for-steg instruksjoner:

1. **Gå til Supabase Dashboard**
   - Logg inn på https://supabase.com
   - Velg ditt prosjekt

2. **Åpne SQL Editor**
   - Klikk på "SQL Editor" i venstre meny
   - Klikk på "New query" eller "+ New"

3. **Kopier SQL-koden**
   - Åpne filen: `lib/RUN_THIS_MIGRATION.sql`
   - Kopier hele innholdet i filen

4. **Lim inn og kjør**
   - Lim inn koden i SQL Editor
   - Klikk på "Run" knappen (eller trykk Ctrl/Cmd + Enter)

5. **Sjekk resultat**
   - Du skal se meldingen: "Migration completed! Alle kolonner lagt til."
   - Hvis du får feilmeldinger, send dem til support

6. **Restart appen**
   - Lukk og åpne appen på nytt
   - Problemet skal nå være løst

## Hva gjør migrasjonen?

Migrasjonen legger til følgende kolonner:

### Categories tabell:
- `image_path` - For å lagre bilde-sti
- `category_order` - For å sortere kategorier

### Products tabell:
- `product_order` - For å sortere produkter
- `image_path` - For å lagre bilde-sti
- `sizes` - For å lagre størrelser som JSON

Disse kolonnene er nødvendige for at "Bytt plass" funksjonen og bilde-håndtering skal fungere.

## Trenger du hjelp?

Hvis du får problemer med å kjøre migrasjonen:
1. Ta skjermbilde av feilmeldingen
2. Send den sammen med beskrivelse av problemet
