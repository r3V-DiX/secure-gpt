#!/usr/bin/env python3
"""
File line count validator.
Ensures that no source code file exceeds a maximum number of lines (default: 300).
Counts all lines (including blanks and comments).
Can be run against the whole repository or against specific staged files.
"""

import os
import sys
import argparse
from typing import List, Tuple

# Extensions subject to the line count rule
CHECK_EXTENSIONS = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py"}

# Directories to ignore
IGNORE_DIRS = {
    "node_modules",
    "venv",
    ".venv",
    "dist",
    "build",
    ".next",
    ".next-admin",
    ".git",
    ".gemini",
    ".agents",
    "__pycache__",
    ".turbo",
    ".cache",
    "coverage",
}

def count_file_lines(file_path: str) -> int:
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            return sum(1 for _ in f)
    except Exception as e:
        print(f"Warning: could not read {file_path}: {e}", file=sys.stderr)
        return 0

def should_check_file(file_path: str) -> bool:
    parts = os.path.normpath(file_path).split(os.sep)
    if any(part in IGNORE_DIRS for part in parts):
        return False
    _, ext = os.path.splitext(file_path)
    return ext.lower() in CHECK_EXTENSIONS

def scan_paths(paths: List[str], max_lines: int) -> List[Tuple[str, int]]:
    violations: List[Tuple[str, int]] = []
    
    for target in paths:
        if os.path.isfile(target):
            if should_check_file(target):
                lines = count_file_lines(target)
                if lines > max_lines:
                    violations.append((target, lines))
        elif os.path.isdir(target):
            for root, dirs, files in os.walk(target):
                dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
                for file in files:
                    file_path = os.path.join(root, file)
                    if should_check_file(file_path):
                        lines = count_file_lines(file_path)
                        if lines > max_lines:
                            violations.append((file_path, lines))
    return violations

def main() -> int:
    parser = argparse.ArgumentParser(description="Check source files for maximum line count.")
    parser.add_argument("paths", nargs="*", default=["."], help="Files or directories to scan (default: current directory)")
    parser.add_argument("--max-lines", type=int, default=300, help="Maximum allowed lines per file (default: 300)")
    parser.add_argument("--staged-only", action="store_true", help="Scan only git staged files")
    args = parser.parse_args()

    targets = args.paths
    if args.staged_only:
        import subprocess
        try:
            out = subprocess.check_output(["git", "diff", "--cached", "--name-only", "--diff-filter=ACM"], text=True)
            targets = [line.strip() for line in out.splitlines() if line.strip()]
            if not targets:
                print("No staged files to check.")
                return 0
        except Exception as e:
            print(f"Error fetching staged git files: {e}", file=sys.stderr)
            return 1

    violations = scan_paths(targets, args.max_lines)

    if violations:
        violations.sort(key=lambda x: x[1], reverse=True)
        print(f"\n❌ Line Count Violation: {len(violations)} file(s) exceed {args.max_lines} lines:\n")
        for file_path, lines in violations:
            print(f"  {lines:4d} lines : {file_path}")
        print(f"\nRule: Every source file must be <= {args.max_lines} lines (including comments and blanks).")
        print("Please split large files into modular components, helpers, or sub-routers.\n")
        return 1
    else:
        print(f"✅ All checked files are within the {args.max_lines}-line limit.")
        return 0

if __name__ == "__main__":
    sys.exit(main())
