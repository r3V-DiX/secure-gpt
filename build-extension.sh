#!/usr/bin/env bash

# ==============================================================================
# SecureGPT Extension Build & Package Script
#
# Builds the Chrome extension for:
#   - development (http://localhost:8000 & http://localhost:3000)
#   - production  (https://api.securegpt.rkavach.com & https://securegpt.rkavach.com)
#
# Usage:
#   ./build-extension.sh dev                    # Build development unpacked dist
#   ./build-extension.sh prod                   # Build production (prompts for version)
#   ./build-extension.sh prod 1.2.0             # Build production with specified version
#   ./build-extension.sh prod 1.2.0 --zip       # Build production and create zip for Web Store
#   ./build-extension.sh watch                  # Watch mode for development
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SECURE_GPT_DIR="$SCRIPT_DIR/secure-gpt"
EXT_DIR="$SECURE_GPT_DIR/packages/extension"
DIST_DIR="$EXT_DIR/dist"
MANIFEST_FILE="$EXT_DIR/public/manifest.json"
PACKAGE_JSON="$EXT_DIR/package.json"

# Colors
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

log() {
    local color="$1"
    local prefix="$2"
    local message="$3"
    echo -e "${color}[${prefix}]${NC} ${message}"
}

usage() {
    echo -e "${BOLD}Usage:${NC} $0 [dev|prod|watch] [version] [--zip]"
    echo ""
    echo "Commands:"
    echo "  dev                 Build development mode (localhost endpoints)"
    echo "  prod [version]      Build production mode (version is compulsory)"
    echo "  watch               Run in continuous watch mode (development)"
    echo ""
    echo "Options:"
    echo "  --zip               Also create a distribution zip package"
    echo ""
    echo "Examples:"
    echo "  $0 dev"
    echo "  $0 prod 1.2.0"
    echo "  $0 prod 1.2.0 --zip"
    exit 1
}

MODE="${1:-}"
CREATE_ZIP=false
VERSION_INPUT=""

# Check arguments
for arg in "$@"; do
    if [ "$arg" == "--zip" ]; then
        CREATE_ZIP=true
    elif [ "$arg" != "$MODE" ] && [ -z "$VERSION_INPUT" ] && [[ "$arg" != -* ]]; then
        VERSION_INPUT="$arg"
    fi
done

if [ -z "$MODE" ]; then
    echo -e "${BOLD}Select build target:${NC}"
    echo "  1) Development (dev)"
    echo "  2) Production  (prod)"
    echo "  3) Watch mode  (watch)"
    read -rp "Enter choice [1-3] (default 1): " choice
    case "$choice" in
        2) MODE="prod" ;;
        3) MODE="watch" ;;
        *) MODE="dev" ;;
    esac
fi

case "$MODE" in
    dev|development)
        BUILD_MODE="development"
        NPM_SCRIPT="build:dev"
        ;;
    prod|production)
        BUILD_MODE="production"
        NPM_SCRIPT="build:prod"
        ;;
    watch|dev:watch)
        BUILD_MODE="watch"
        NPM_SCRIPT="dev"
        ;;
    -h|--help|help)
        usage
        ;;
    *)
        log "$RED" "ERROR" "Unknown mode '$MODE'"
        usage
        ;;
esac

# Handle production version requirement
if [ "$BUILD_MODE" == "production" ]; then
    CURRENT_VERSION=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$MANIFEST_FILE')).version)")
    
    # Check if version was provided as argument or prompt for it
    while [ -z "$VERSION_INPUT" ]; do
        echo -e "${BOLD}Current version:${NC} ${CYAN}$CURRENT_VERSION${NC}"
        read -rp "Enter new version for production (e.g. 1.2.0): " input_val
        input_val="$(echo "$input_val" | tr -d '[:space:]')"
        if [ -n "$input_val" ]; then
            VERSION_INPUT="$input_val"
        else
            log "$RED" "ERROR" "Version number is compulsory for production build!"
        fi
    done

    # Validate version format (semver: X.Y.Z or X.Y.Z.W)
    if ! [[ "$VERSION_INPUT" =~ ^[0-9]+(\.[0-9]+){1,3}$ ]]; then
        log "$RED" "ERROR" "Invalid version format '$VERSION_INPUT'. Expected format like 1.2.0 or 1.1.3.1"
        exit 1
    fi

    log "$CYAN" "VERSION" "Setting extension version to: ${BOLD}$VERSION_INPUT${NC}"

    # Update public/manifest.json and package.json
    node -e "
      const fs = require('fs');
      const ver = '$VERSION_INPUT';
      
      const manifestPath = '$MANIFEST_FILE';
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      manifest.version = ver;
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
      
      const pkgPath = '$PACKAGE_JSON';
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      pkg.version = ver;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    "
fi

cd "$EXT_DIR"

if [ "$BUILD_MODE" == "watch" ]; then
    log "$CYAN" "WATCH" "Starting extension in development watch mode..."
    npm run dev
    exit 0
fi

log "$CYAN" "BUILD" "Building SecureGPT Extension for ${BOLD}${BUILD_MODE}${NC}..."

# Run through npm run so workspace node_modules/.bin (vite, etc.) is in PATH
npm run "$NPM_SCRIPT"

BUILT_VERSION=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$DIST_DIR/manifest.json')).version)")

log "$GREEN" "SUCCESS" "Extension (v$BUILT_VERSION) built successfully into:"
echo -e "  📂 ${BOLD}$DIST_DIR${NC}"
echo -e "  To load: Open ${CYAN}chrome://extensions${NC} -> Enable Developer Mode -> Click 'Load unpacked' -> Select the dist folder."

if [ "$CREATE_ZIP" = true ]; then
    OUTPUT_ZIP="$SCRIPT_DIR/secure-gpt-extension-v${BUILT_VERSION}-${BUILD_MODE}.zip"
    
    log "$CYAN" "PACKAGE" "Packaging extension into ZIP..."
    rm -f "$OUTPUT_ZIP"
    
    (
        cd "$DIST_DIR"
        zip -r "$OUTPUT_ZIP" . > /dev/null
    )
    
    log "$GREEN" "PACKAGE" "ZIP package created at: ${BOLD}$OUTPUT_ZIP${NC} ($(du -h "$OUTPUT_ZIP" | cut -f1))"
fi
