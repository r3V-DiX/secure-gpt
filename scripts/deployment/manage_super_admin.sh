#!/bin/bash

# ==========================================
# SecureGPT - Manage Super Admin Script
# ==========================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_info() { echo -e "${GREEN}[INFO]${NC} $1"; }

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: sudo bash scripts/manage_super_admin.sh <add|remove> <email>"
    echo "Example: sudo bash scripts/manage_super_admin.sh add admin@example.com"
    exit 1
fi

ACTION=$1
EMAIL=$2

if [ "$ACTION" != "add" ] && [ "$ACTION" != "remove" ] && [ "$ACTION" != "delete" ]; then
    print_error "Invalid action. Use 'add' or 'remove'."
    exit 1
fi

DEPLOY_DIR="/opt/secure-gpt"

if [ ! -d "$DEPLOY_DIR" ]; then
    print_error "Production not found at $DEPLOY_DIR"
    exit 1
fi

cd $DEPLOY_DIR

print_info "Running command in secure-gpt-admin-backend container..."
sudo docker exec secure-gpt-admin-backend python -m app.commands.manage_super_admin "$ACTION" "$EMAIL"
