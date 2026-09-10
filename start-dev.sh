#!/usr/bin/env bash

# ==============================================================================
# SecureGPT Multi-Service Runner
# Starts:
#   1. SecureGPT Backend         -> http://localhost:8000
#   2. SecureGPT Admin Backend   -> http://localhost:8001
#   3. SecureGPT Dashboard       -> http://localhost:3000
#   4. SecureGPT Admin Dashboard -> http://localhost:3001
#
# Python environment: Conda venv from secure-gpt/backend/venv
# ==============================================================================

set -uo pipefail

# Project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"

# Colors for terminal output
BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Paths
VENV_PATH="$ROOT_DIR/secure-gpt/backend/venv"
VENV_PYTHON="$VENV_PATH/bin/python"
VENV_UVICORN="$VENV_PATH/bin/uvicorn"

SECURE_GPT_DIR="$ROOT_DIR/secure-gpt"
ADMIN_DIR="$ROOT_DIR/secure-gpt-admin"

# Process IDs
PID_BE=0
PID_ADMIN_BE=0
PID_FE=0
PID_ADMIN_FE=0

print_header() {
    echo -e "${BOLD}${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                  SecureGPT Service Runner                    ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

log() {
    local color="$1"
    local prefix="$2"
    local message="$3"
    echo -e "${color}[${prefix}]${NC} ${message}"
}

cleanup() {
    echo ""
    log "$YELLOW" "SHUTDOWN" "Stopping all services..."

    local pids=($PID_BE $PID_ADMIN_BE $PID_FE $PID_ADMIN_FE)
    for pid in "${pids[@]}"; do
        if [ "$pid" -gt 0 ] && kill -0 "$pid" 2>/dev/null; then
            kill -TERM "$pid" 2>/dev/null || true
        fi
    done

    # Give processes a moment to gracefully shutdown
    sleep 1

    # Force kill any lingering processes
    for pid in "${pids[@]}"; do
        if [ "$pid" -gt 0 ] && kill -0 "$pid" 2>/dev/null; then
            kill -KILL "$pid" 2>/dev/null || true
        fi
    done

    log "$GREEN" "SHUTDOWN" "All services stopped."
    exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM EXIT

# Check python venv
if [ ! -f "$VENV_PYTHON" ]; then
    log "$RED" "ERROR" "Conda venv python not found at: $VENV_PYTHON"
    exit 1
fi

if [ ! -f "$VENV_UVICORN" ]; then
    log "$RED" "ERROR" "Uvicorn not found at: $VENV_UVICORN"
    exit 1
fi

# Function to check if a port is in use
check_port() {
    local port="$1"
    local name="$2"
    if command -v lsof >/dev/null 2>&1; then
        if lsof -iTCP:"$port" -sTCP:LISTEN -P -n >/dev/null 2>&1; then
            log "$RED" "PORT CONFLICT" "Port $port is already in use (required for $name)."
            log "$YELLOW" "PORT CONFLICT" "Please stop the process using port $port and try again."
            exit 1
        fi
    fi
}

print_header

log "$BLUE" "ENV" "Using Conda venv: $VENV_PATH"
log "$BLUE" "ENV" "Python version: $("$VENV_PYTHON" --version)"
echo ""

# Verify ports are clear
check_port 8000 "SecureGPT Backend"
check_port 8001 "SecureGPT Admin Backend"
check_port 3000 "SecureGPT Frontend"
check_port 3001 "SecureGPT Admin Frontend"

# 1. Start SecureGPT Backend (Port 8000)
log "$GREEN" "STARTING" "SecureGPT Backend on http://localhost:8000"
(
    cd "$SECURE_GPT_DIR/backend"
    exec "$VENV_UVICORN" app.main:app --reload --host 0.0.0.0 --port 8000
) 2>&1 | sed -e "s/^/$(echo -e "${GREEN}[BE:8000]${NC} ")/" &
PID_BE=$!

# 2. Start SecureGPT Admin Backend (Port 8001)
log "$MAGENTA" "STARTING" "SecureGPT Admin Backend on http://localhost:8001"
(
    cd "$ADMIN_DIR/backend"
    exec "$VENV_UVICORN" app.main:app --reload --host 0.0.0.0 --port 8001
) 2>&1 | sed -e "s/^/$(echo -e "${MAGENTA}[ADMIN-BE:8001]${NC} ")/" &
PID_ADMIN_BE=$!

# 3. Start SecureGPT Dashboard (Port 3000)
log "$CYAN" "STARTING" "SecureGPT Dashboard on http://localhost:3000"
(
    cd "$SECURE_GPT_DIR/packages/secure-gpt-dashboard"
    export PORT=3000
    exec npm run dev -- -p $PORT
) 2>&1 | sed -e "s/^/$(echo -e "${CYAN}[FE:3000]${NC} ")/" &
PID_FE=$!

# 4. Start SecureGPT Admin Dashboard (Port 3001)
log "$YELLOW" "STARTING" "SecureGPT Admin Dashboard on http://localhost:3001"
(
    cd "$ADMIN_DIR/packages/secure-gpt-dashboard"
    export PORT=3001
    exec npm run dev -- -p $PORT
) 2>&1 | sed -e "s/^/$(echo -e "${YELLOW}[ADMIN-FE:3001]${NC} ")/" &
PID_ADMIN_FE=$!

echo ""
log "$BOLD$GREEN" "READY" "All 4 services launched in background!"
echo -e "  • SecureGPT Backend:       ${BOLD}http://localhost:8000${NC} (Docs: http://localhost:8000/docs)"
echo -e "  • SecureGPT Frontend:      ${BOLD}http://localhost:3000${NC}"
echo -e "  • SecureGPT Admin Backend: ${BOLD}http://localhost:8001${NC} (Docs: http://localhost:8001/docs)"
echo -e "  • SecureGPT Admin Frontend:${BOLD}http://localhost:3001${NC}"
echo ""
log "$BOLD" "INFO" "Press Ctrl+C to stop all services."
echo ""

# Wait for all background jobs
wait
