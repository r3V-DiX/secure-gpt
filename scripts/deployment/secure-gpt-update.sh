#!/bin/bash

# ==========================================
# SecureGPT - Production Update Script
# Includes: Backend, Dashboard, Admin Backend, Admin Frontend
# ==========================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

wait_for_containers() {
    print_info "Waiting for containers to stabilize..."
    local max_wait=120
    local elapsed=0
    local interval=5

    while [ $elapsed -lt $max_wait ]; do
        local restarting=$(docker compose ps --format json 2>/dev/null | grep -c '"Restarting"' || true)
        local starting=$(docker compose ps --format json 2>/dev/null | grep -c '"Starting"' || true)

        if [ "$restarting" -eq 0 ] && [ "$starting" -eq 0 ]; then
            print_info "All containers stabilized ✓"
            docker compose ps
            return 0
        fi

        echo -n "."
        sleep $interval
        elapsed=$((elapsed + interval))
    done

    print_warn "Containers took too long to stabilize. Check logs:"
    docker compose ps
    docker compose logs --tail 20
}

echo "=========================================="
echo "   🔄 SecureGPT - Production Update"
echo "=========================================="
echo ""

if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root: sudo bash secure-gpt-update.sh"
    exit 1
fi

DEPLOY_DIR="/opt/secure-gpt"

if [ ! -d "$DEPLOY_DIR" ]; then
    print_error "Production not found at $DEPLOY_DIR"
    exit 1
fi

cd $DEPLOY_DIR

AWS_REGION="ap-south-1"
ECR_REGISTRY="443370715886.dkr.ecr.ap-south-1.amazonaws.com"
SECRET_NAME="secure-gpt-secrets"

print_info "Logging in to Amazon ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
print_info "ECR login successful ✓"

echo ""
echo "What would you like to update?"
echo ""
echo "  1) Update Backend only"
echo "  2) Update Dashboard only"
echo "  3) Update Admin Backend only"
echo "  4) Update Admin Frontend only"
echo "  5) Update All Services"
echo "  6) Refresh secrets from AWS + Restart"
echo "  7) Full Update (new images + fresh secrets + restart)"
echo ""
read -p "Select option (1-7): " OPTION

refresh_secrets() {
    print_info "Fetching latest secrets from AWS Secrets Manager..."

    SECRETS=$(aws secretsmanager get-secret-value \
        --secret-id $SECRET_NAME \
        --region $AWS_REGION \
        --query SecretString \
        --output text)

    SECRET_KEY=$(echo $SECRETS | jq -r '.SECRET_KEY')
    SESSION_SECRET_KEY=$(echo $SECRETS | jq -r '.SESSION_SECRET_KEY')
    DATABASE_URL=$(echo $SECRETS | jq -r '.DATABASE_URL')
    GOOGLE_CLIENT_ID=$(echo $SECRETS | jq -r '.GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET=$(echo $SECRETS | jq -r '.GOOGLE_CLIENT_SECRET')
    RESEND_API_KEY=$(echo $SECRETS | jq -r '.RESEND_API_KEY // ""')
    EMAIL_FROM=$(echo $SECRETS | jq -r '.EMAIL_FROM // ""')

    print_info "Fetching parameters from SSM Parameter Store..."

    APP_NAME=$(aws ssm get-parameter --name "/secure-gpt/backend/app-name" --region $AWS_REGION --query Parameter.Value --output text)
    APP_ENV=$(aws ssm get-parameter --name "/secure-gpt/backend/app-env" --region $AWS_REGION --query Parameter.Value --output text)
    DEBUG=$(aws ssm get-parameter --name "/secure-gpt/backend/debug" --region $AWS_REGION --query Parameter.Value --output text)
    SESSION_MAX_AGE=$(aws ssm get-parameter --name "/secure-gpt/backend/session-max-age" --region $AWS_REGION --query Parameter.Value --output text)
    GOOGLE_REDIRECT_URI=$(aws ssm get-parameter --name "/secure-gpt/backend/google-redirect-uri" --region $AWS_REGION --query Parameter.Value --output text)
    ALLOWED_ORIGINS=$(aws ssm get-parameter --name "/secure-gpt/backend/allowed-origins" --region $AWS_REGION --query Parameter.Value --output text)
    API_V1_PREFIX=$(aws ssm get-parameter --name "/secure-gpt/backend/api-v1-prefix" --region $AWS_REGION --query Parameter.Value --output text)

    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    print_info "Backed up existing .env ✓"

    cat > .env << ENV_EOF
# ─── Application ──────────────────────────────────────────────────────────────
APP_NAME=${APP_NAME}
APP_ENV=${APP_ENV}
DEBUG=${DEBUG}
SECRET_KEY=${SECRET_KEY}

# ─── Database ─────────────────────────────────────────────────────────────────
DATABASE_URL=${DATABASE_URL}

# ─── Session ──────────────────────────────────────────────────────────────────
SESSION_SECRET_KEY=${SESSION_SECRET_KEY}
SESSION_MAX_AGE=${SESSION_MAX_AGE}

# ─── Google OAuth ─────────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
GOOGLE_REDIRECT_URI=${GOOGLE_REDIRECT_URI}

# ─── CORS ─────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS=${ALLOWED_ORIGINS}

# ─── Email ────────────────────────────────────────────────────────────────────
RESEND_API_KEY=${RESEND_API_KEY}
EMAIL_FROM=${EMAIL_FROM}

# ─── API ──────────────────────────────────────────────────────────────────────
API_V1_PREFIX=${API_V1_PREFIX}
ENV_EOF

    chmod 600 .env
    print_info "Secrets refreshed and .env updated ✓ (shared by backend + admin-backend)"
}

case $OPTION in
    1)
        print_step "Updating Backend..."
        docker compose pull backend
        docker compose up -d --force-recreate backend
        wait_for_containers
        ;;
    2)
        print_step "Updating Dashboard..."
        docker compose pull dashboard
        docker compose up -d --force-recreate dashboard
        wait_for_containers
        ;;
    3)
        print_step "Updating Admin Backend..."
        docker compose pull admin-backend
        docker compose up -d --force-recreate admin-backend
        wait_for_containers
        ;;
    4)
        print_step "Updating Admin Frontend..."
        docker compose pull admin-frontend
        docker compose up -d --force-recreate admin-frontend
        wait_for_containers
        ;;
    5)
        print_step "Updating All Services..."
        docker compose pull
        docker compose up -d --force-recreate
        wait_for_containers
        ;;
    6)
        print_step "Refreshing secrets and restarting..."
        refresh_secrets
        docker compose up -d --force-recreate
        wait_for_containers
        ;;
    7)
        print_step "Running full update..."
        refresh_secrets
        docker compose pull
        docker compose up -d --force-recreate
        wait_for_containers
        ;;
    *)
        print_error "Invalid option"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
print_step "Final Status:"
echo "=========================================="
echo ""
docker compose ps
echo ""
print_info "📋 Useful Commands:"
echo "  All logs:               docker compose logs -f"
echo "  Backend logs:           docker compose logs -f backend"
echo "  Dashboard logs:         docker compose logs -f dashboard"
echo "  Admin backend logs:     docker compose logs -f admin-backend"
echo "  Admin frontend logs:    docker compose logs -f admin-frontend"
echo "  Restart:                docker compose restart"
echo ""
echo ""
echo "=========================================="
print_step "Verifying Release Versions:"
echo "=========================================="
echo "Checking Backend Version (/api/v1/system/version)..."
curl -s http://localhost:8000/api/v1/system/version || echo "Backend check skipped/offline"
echo ""
echo "Checking Admin Backend Version (/api/v1/system/version)..."
curl -s http://localhost:8001/api/v1/system/version || echo "Admin backend check skipped/offline"
echo ""

echo "=========================================="
print_info "✅ Update Complete!"
echo "=========================================="
