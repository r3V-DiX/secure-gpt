#!/usr/bin/env bash
# Git pre-commit hook to prevent committing files exceeding 300 lines

REPO_ROOT="$(git rev-parse --show-toplevel)"
CHECKER="$REPO_ROOT/scripts/check_file_length.py"

if [ -f "$CHECKER" ]; then
    python3 "$CHECKER" --staged-only --max-lines 300
    EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
        echo "❌ Commit rejected: One or more staged files exceed 300 lines."
        echo "Please split large files before committing."
        exit 1
    fi
fi

exit 0
