# 🔧 LØSNING: "Bundling failed without error"

## Problem
Appen feiler under oppstart med feilmeldingen "Bundling failed without error".

## Årsak
Det er to hovedproblemer:

1. **app.json har en duplikat nøkkel** i iOS-innstillingene (linje 30-41)
2. **Metro bundler cache** er korrupt

## Løsning (2 enkle trinn)

### TRINN 1: Fiks app.json ⚠️ KRITISK

Åpne `app.json` og finn `entitlements` seksjonen (rundt linje 30-41).

**Feil (nåværende):**
```json
"entitlements": {
  "com.apple.developer.networking.wifi-info": true,
  "com": {
    "apple": {
      "developer": {
        "networking": {
          "wifi-info": true
        }
      }
    }
  }
},
```

**Riktig (skal være):**
```json
"entitlements": {
  "com.apple.developer.networking.wifi-info": true
},
```

Fjern hele `"com": { ... }` objektet. Det er en duplikat av samme tillatelse.

### TRINN 2: Kjør fix-scriptet

```bash
chmod +x QUICK_FIX.sh
./QUICK_FIX.sh
```

Eller manuelt:
```bash
# Tøm cache
rm -rf node_modules/.cache .expo
rm -rf $TMPDIR/metro-* $TMPDIR/haste-map-* $TMPDIR/react-*

# Start på nytt
bun run start
```

## Hvis det fortsatt ikke funker

1. **Reinstaller dependencies:**
   ```bash
   rm -rf node_modules
   bun install
   bunx expo start --clear
   ```

2. **Sjekk for syntax feil:**
   ```bash
   bun run lint
   ```

## Hvorfor skjedde dette?

Den duplikate nøkkelen i app.json forvirrer Metro bundler, og får den til å feile uten å gi en klar feilmelding. Dette er et kjent problem med Expo når app.json har ugyldig konfigurasjon.

## Rask test

Etter du har fikset app.json og kjørt QUICK_FIX.sh, kjør:
```bash
bun run start
```

Appen skal nå starte uten feil! ✅
