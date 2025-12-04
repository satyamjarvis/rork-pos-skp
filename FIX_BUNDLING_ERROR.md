# Fix: Bundling Failed Without Error

## Problem
The app is experiencing "Bundling failed without error" issue. This is typically caused by:
1. Metro bundler cache corruption
2. Invalid configuration in app.json
3. Module resolution issues

## Solution Steps

### Step 1: Fix app.json Configuration Issue

There's a duplicate key issue in the iOS entitlements section. Open `app.json` and find the `entitlements` section (around line 30-41). 

**Current (incorrect):**
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

**Should be (correct):**
```json
"entitlements": {
  "com.apple.developer.networking.wifi-info": true
},
```

Remove the nested "com" object as it's a duplicate of the same permission.

### Step 2: Clear All Caches

Run these commands in order:

```bash
# 1. Stop the dev server (Ctrl+C if running)

# 2. Clear Metro bundler cache
rm -rf node_modules/.cache
rm -rf .expo
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-map-*
rm -rf $TMPDIR/react-*

# 3. Clear watchman cache (if installed)
watchman watch-del-all 2>/dev/null || echo "Watchman not installed, skipping..."

# 4. Restart
bun run start
```

Or use the provided script:
```bash
chmod +x ./clear-cache.sh
./clear-cache.sh
```

### Step 3: If Still Not Working

If the error persists after clearing cache and fixing app.json:

1. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules
   rm bun.lock
   bun install
   ```

2. **Check for syntax errors:**
   ```bash
   bun run lint
   ```

3. **Try starting with fresh cache:**
   ```bash
   bunx expo start --clear
   ```

4. **Check for circular dependencies** - Make sure no files are importing each other in a loop.

## Most Likely Cause

The duplicate key in `app.json` entitlements is causing the Metro bundler to fail silently. Fix this first, then clear cache.
