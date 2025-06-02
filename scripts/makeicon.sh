#!/usr/bin/env bash
set -e

# Usage: ./generate_icons.sh path/to/source-icon.png
SRC="$1"
if [[ -z "$SRC" || ! -f "$SRC" ]]; then
  echo "Usage: $0 path/to/source-icon.png"
  exit 1
fi

# We'll output everything in the current directory
OUT="."
ICONSET="icon.iconset"

# Clean up any previous runs
rm -rf "$ICONSET"
mkdir "$ICONSET"

# 1) Compress source PNG
pngquant --quality=60-80 --force --output "$OUT/icon-optimized.png" "$SRC"
SRC2="$OUT/icon-optimized.png"

# 2) Generate iconset images for macOS
for SIZE in 16 32 128 256 512; do
  sips -z $SIZE $SIZE     "$SRC2" --out "$ICONSET/icon_${SIZE}x${SIZE}.png"
  sips -z $((SIZE*2)) $((SIZE*2)) "$SRC2" --out "$ICONSET/icon_${SIZE}x${SIZE}@2x.png"
done

# 3) Build the .icns file
iconutil -c icns "$ICONSET" --output "$OUT/icon.icns"

# 4) Cleanup the iconset folder
rm -rf "$ICONSET"

# 5) Build the .ico file for Windows
convert "$SRC2" -define icon:auto-resize=16,32,48,256 "$OUT/icon.ico"

echo "✅ Generated in current directory:"
echo "   icon-optimized.png"
echo "   icon.icns"
echo "   icon.ico"


mv icon-optimized.png icon.png
