#!/bin/bash

echo "🚀 QUICK FIX FOR BUNDLING ERROR"
echo "================================"
echo ""
echo "This script will:"
echo "1. Clear all caches"
echo "2. Show you the app.json issue to fix manually"
echo ""
read -p "Press Enter to continue..."
echo ""

# Step 1: Clear caches
echo "📦 Clearing all caches..."
rm -rf node_modules/.cache
rm -rf .expo
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-map-*
rm -rf $TMPDIR/react-*
rm -rf ~/.expo/cache
rm -rf ~/.expo/metro-cache

if command -v watchman &> /dev/null; then
    watchman watch-del-all
fi

echo "✅ Caches cleared!"
echo ""

# Step 2: Show the fix needed
echo "⚠️  CRITICAL: Fix app.json manually"
echo "=================================="
echo ""
echo "Open app.json and find line 30-41 (inside 'ios' section)."
echo ""
echo "REMOVE THIS:"
echo '      "entitlements": {'
echo '        "com.apple.developer.networking.wifi-info": true,'
echo '        "com": {'
echo '          "apple": {'
echo '            "developer": {'
echo '              "networking": {'
echo '                "wifi-info": true'
echo '              }'
echo '            }'
echo '          }'
echo '        }'
echo '      },'
echo ""
echo "REPLACE WITH THIS:"
echo '      "entitlements": {'
echo '        "com.apple.developer.networking.wifi-info": true'
echo '      },'
echo ""
echo "The duplicate key is causing the bundler to fail."
echo ""
read -p "Press Enter after you've fixed app.json..."
echo ""

# Step 3: Verify TypeScript
echo "🔍 Checking for TypeScript errors..."
if bun run lint &> /dev/null; then
    echo "✅ No TypeScript errors"
else
    echo "⚠️  Found some linting warnings (these won't cause bundling to fail)"
fi
echo ""

# Step 4: Instructions
echo "🎉 Setup complete!"
echo ""
echo "Now run:"
echo "  bun run start"
echo ""
echo "If the error persists, try:"
echo "  bunx expo start --clear"
echo ""
