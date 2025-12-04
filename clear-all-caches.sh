#!/bin/bash

echo "🧹 COMPREHENSIVE CACHE CLEARING SCRIPT"
echo "======================================="
echo ""

echo "📦 Step 1: Clearing Metro bundler cache..."
rm -rf node_modules/.cache
rm -rf .expo
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-map-*
rm -rf $TMPDIR/react-*
echo "✅ Metro cache cleared"
echo ""

echo "👁️ Step 2: Clearing Watchman cache..."
if command -v watchman &> /dev/null; then
    watchman watch-del-all
    echo "✅ Watchman cache cleared"
else
    echo "⚠️  Watchman not installed, skipping..."
fi
echo ""

echo "🔧 Step 3: Clearing temporary files..."
rm -rf /tmp/react-*
rm -rf /tmp/metro-*
rm -rf ~/.expo
echo "✅ Temporary files cleared"
echo ""

echo "📱 Step 4: Clearing Expo cache..."
if command -v expo &> /dev/null; then
    expo start --clear 2>/dev/null &
    EXPO_PID=$!
    sleep 2
    kill $EXPO_PID 2>/dev/null
    echo "✅ Expo cache cleared"
else
    echo "⚠️  Expo CLI not found globally, skipping..."
fi
echo ""

echo "🎉 All caches cleared successfully!"
echo ""
echo "⚠️  IMPORTANT: Before restarting, please fix app.json:"
echo "   Remove the duplicate 'com.apple.developer.networking.wifi-info' key"
echo "   See FIX_BUNDLING_ERROR.md for details"
echo ""
echo "Now restart the dev server with:"
echo "  bun run start"
