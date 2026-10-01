#!/usr/bin/env bash

# Keep the project-root entry point while using the maintained launcher.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/scripts/development/start-dev.sh" "$@"
