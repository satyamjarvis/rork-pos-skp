#!/bin/bash

echo "🧹 Clearing ALL caches..."

# Metro bundler cache
echo "- Metro bundler cache..."
rm -rf node_modules/.cache
rm -rf .expo
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-map-*
rm -rf $TMPDIR/react-*

# Expo cache
echo "- Expo cache..."
rm -rf ~/.expo/cache
rm -rf ~/.expo/metro-cache

# Watchman (if available)
if command -v watchman &> /dev/null
then
    echo "- Watchman cache..."
    watchman watch-del-all
fi

echo ""
echo "✅ All caches cleared!"
echo ""
echo "Now restart the dev server with: bun run start"
