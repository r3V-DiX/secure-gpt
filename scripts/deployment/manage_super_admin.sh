#!/bin/bash

# ==========================================
# SecureGPT - Manage & View Super Admins
# ==========================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_info() { echo -e "${GREEN}[INFO]${NC} $1"; }

show_usage() {
    echo "Usage: sudo bash scripts/deployment/manage_super_admin.sh <list|add|remove> [email]"
    echo ""
    echo "Commands:"
    echo "  list                        List all Super Administrators"
    echo "  add <email>                 Grant Super Admin rights to a user"
    echo "  remove <email>              Revoke Super Admin rights from a user"
    echo ""
    echo "Examples:"
    echo "  sudo bash scripts/deployment/manage_super_admin.sh list"
    echo "  sudo bash scripts/deployment/manage_super_admin.sh add admin@example.com"
    echo "  sudo bash scripts/deployment/manage_super_admin.sh remove admin@example.com"
    exit 1
}

if [ -z "$1" ]; then
    show_usage
fi

ACTION=$(echo "$1" | tr '[:upper:]' '[:lower:]')
EMAIL="$2"

case "$ACTION" in
    list|view|ls)
        # Email not required
        ;;
    add|remove|delete)
        if [ -z "$EMAIL" ]; then
            print_error "Email is required for action '$ACTION'."
            show_usage
        fi
        ;;
    *)
        print_error "Invalid action '$ACTION'."
        show_usage
        ;;
esac

DEPLOY_DIR="/opt/secure-gpt"

if [ ! -d "$DEPLOY_DIR" ]; then
    DEPLOY_DIR="."
fi

cd "$DEPLOY_DIR"

CONTAINER="secure-gpt-admin-backend"
if ! sudo docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    if sudo docker ps --format '{{.Names}}' | grep -q "^secure-gpt-backend$"; then
        CONTAINER="secure-gpt-backend"
    fi
fi

print_info "Executing '$ACTION' in container '$CONTAINER'..."

if [ "$ACTION" = "list" ] || [ "$ACTION" = "view" ] || [ "$ACTION" = "ls" ]; then
    sudo docker exec "$CONTAINER" python -m app.commands.manage_super_admin list
else
    sudo docker exec "$CONTAINER" python -m app.commands.manage_super_admin "$ACTION" "$EMAIL"
fi
