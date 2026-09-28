#!/bin/bash
# scripts/package-extension.sh — Packages the compiled extension dist folder into a clean ZIP

# Read version from manifest.json
VERSION=$(node -e "console.log(require('./secure-gpt/packages/extension/dist/manifest.json').version)")
OUTPUT_ZIP="secure-gpt-extension-v${VERSION}.zip"

echo "Packaging extension version v${VERSION}..."

# Remove old zip if exists
rm -f "$OUTPUT_ZIP"

# Navigate to build directory and zip contents
cd secure-gpt/packages/extension/dist || { echo "Error: dist directory not found. Please build extension first."; exit 1; }
zip -r "../../../../${OUTPUT_ZIP}" .

echo "----------------------------------------"
echo "Success! Package created:"
echo "File: ${OUTPUT_ZIP}"
echo "Size: $(du -h "../../../../${OUTPUT_ZIP}" | cut -f1)"
echo "----------------------------------------"
