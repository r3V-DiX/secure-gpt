#!/bin/bash

# ==========================================
# SecureGPT - Production Deployment Script
# EC2 + RDS + AWS Secrets Manager
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

echo "=========================================="
echo "   🚀 SecureGPT - Production Deployment"
echo "   Backend + Dashboard + Admin Backend + Admin Frontend"
echo "=========================================="
echo ""

# Check root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root: sudo bash secure-gpt-deploy.sh"
    exit 1
fi

# ==========================================
# Configuration
# ==========================================
AWS_REGION="ap-south-1"
ECR_REGISTRY="443370715886.dkr.ecr.ap-south-1.amazonaws.com"
DASHBOARD_DOMAIN="securegpt.rkavach.com"
API_DOMAIN="api.securegpt.rkavach.com"
ADMIN_DASHBOARD_DOMAIN="admin.securegpt.rkavach.com"
ADMIN_API_DOMAIN="admin-api.securegpt.rkavach.com"
SECRET_NAME="secure-gpt-secrets"
DEPLOY_DIR="/opt/secure-gpt"

print_info "Deployment Configuration:"
echo "  AWS Region:        $AWS_REGION"
echo "  Dashboard:         http://$DASHBOARD_DOMAIN"
echo "  Backend API:       http://$API_DOMAIN"
echo "  Admin Dashboard:   http://$ADMIN_DASHBOARD_DOMAIN"
echo "  Admin API:         http://$ADMIN_API_DOMAIN"
echo "  Images:"
echo "    $ECR_REGISTRY/secure-gpt-backend:prod-latest"
echo "    $ECR_REGISTRY/secure-gpt-dashboard:prod-latest"
echo "    $ECR_REGISTRY/securegpt-admin-backend:prod-latest"
echo "    $ECR_REGISTRY/securegpt-admin-frontend:prod-latest"
echo ""

# ==========================================
# STEP 1: System Updates & Dependencies
# ==========================================
print_step "1/9: Installing system dependencies..."

# Wait for any apt locks from EC2 startup to release
print_info "Waiting for apt locks to release..."
while fuser /var/lib/apt/lists/lock /var/lib/dpkg/lock /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do
    print_warn "apt is locked by another process, waiting 5s..."
    sleep 5
done
print_info "apt is free ✓"

apt update && apt upgrade -y
apt install -y \
    curl \
    wget \
    git \
    jq \
    nginx \
    snapd \
    unzip \
    ca-certificates \
    gnupg \
    lsb-release

# Install certbot via snap (correct way on Ubuntu 22.04)
print_info "Installing certbot via snap..."
snap install core
snap refresh core
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/bin/certbot

print_info "System dependencies installed ✓"

# ==========================================
# STEP 2: Install AWS CLI
# ==========================================
print_step "2/9: Installing AWS CLI..."

if ! command -v aws &> /dev/null; then
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip -q awscliv2.zip
    ./aws/install
    rm -rf awscliv2.zip aws/
    print_info "AWS CLI installed ✓"
else
    print_info "AWS CLI already installed ✓"
fi

# Verify IAM role is attached
print_info "Verifying IAM role..."
aws sts get-caller-identity --region $AWS_REGION > /dev/null 2>&1 || {
    print_error "IAM role not attached to EC2! Attach secure-gpt-ec2-role and retry."
    exit 1
}
print_info "IAM role verified ✓"

# ==========================================
# STEP 3: Install Docker
# ==========================================
print_step "3/9: Installing Docker..."

if ! command -v docker &> /dev/null; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    systemctl enable docker
    systemctl start docker
    print_info "Docker installed ✓"
else
    print_info "Docker already installed ✓"
fi

# Login to ECR
print_info "Logging in to Amazon ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
print_info "ECR login successful ✓"

# ==========================================
# STEP 4: Fetch Secrets from AWS
# ==========================================
print_step "4/9: Fetching secrets from AWS Secrets Manager..."

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

print_info "All secrets and parameters fetched ✓"

# ==========================================
# STEP 5: Setup Production Directory
# ==========================================
print_step "5/9: Setting up production directory..."

mkdir -p $DEPLOY_DIR
cd $DEPLOY_DIR

# ==========================================
# STEP 6: Create .env File
# ==========================================
print_step "6/9: Creating .env file..."

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
print_info ".env file created ✓ (shared by backend + admin-backend)"

# ==========================================
# STEP 7: Create Docker Compose
# ==========================================
print_step "7/9: Creating docker-compose.yml..."

cat > docker-compose.yml << COMPOSE_EOF
services:
  backend:
    image: ${ECR_REGISTRY}/secure-gpt-backend:prod-latest
    container_name: secure-gpt-backend
    restart: unless-stopped
    env_file: .env
    environment:
      PORTAL_MODE: standard
    ports:
      - "127.0.0.1:8000:8000"
    networks:
      - secure-gpt-network
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  dashboard:
    image: ${ECR_REGISTRY}/secure-gpt-dashboard:prod-latest
    container_name: secure-gpt-dashboard
    restart: unless-stopped
    depends_on:
      backend:
        condition: service_started
    environment:
      NODE_ENV: production
      PORT: 3000
      HOSTNAME: "0.0.0.0"
      NEXT_PUBLIC_BACKEND_URL: http://secure-gpt-backend:8000
      NEXT_PUBLIC_API_URL: https://securegpt.rkavach.com
    ports:
      - "127.0.0.1:3000:3000"
    networks:
      - secure-gpt-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  admin-backend:
    image: ${ECR_REGISTRY}/securegpt-admin-backend:prod-latest
    container_name: secure-gpt-admin-backend
    restart: unless-stopped
    env_file: .env
    environment:
      PORTAL_MODE: admin
    ports:
      - "127.0.0.1:8001:8000"
    networks:
      - secure-gpt-network
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  admin-frontend:
    image: ${ECR_REGISTRY}/securegpt-admin-frontend:prod-latest
    container_name: secure-gpt-admin-frontend
    restart: unless-stopped
    depends_on:
      admin-backend:
        condition: service_started
    environment:
      NODE_ENV: production
      PORT: 3000
      HOSTNAME: "0.0.0.0"
      NEXT_PUBLIC_BACKEND_URL: http://secure-gpt-admin-backend:8000
      NEXT_PUBLIC_API_URL: https://admin-api.securegpt.rkavach.com
    ports:
      - "127.0.0.1:3001:3000"
    networks:
      - secure-gpt-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  secure-gpt-network:
    driver: bridge
COMPOSE_EOF

print_info "docker-compose.yml created ✓ (4 services: backend, dashboard, admin-backend, admin-frontend)"

# ==========================================
# STEP 8: Configure Nginx
# ==========================================
print_step "8/9: Configuring Nginx..."

rm -f /etc/nginx/sites-enabled/default

cat > /etc/nginx/sites-available/secure-gpt-dashboard << NGINX_EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DASHBOARD_DOMAIN};

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
    }
}
NGINX_EOF

cat > /etc/nginx/sites-available/secure-gpt-backend << NGINX_EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${API_DOMAIN};

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_buffering off;
    }
}
NGINX_EOF

cat > /etc/nginx/sites-available/secure-gpt-admin-frontend << NGINX_EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${ADMIN_DASHBOARD_DOMAIN};

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
    }
}
NGINX_EOF

cat > /etc/nginx/sites-available/secure-gpt-admin-backend << NGINX_EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${ADMIN_API_DOMAIN};

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_buffering off;
    }
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/secure-gpt-dashboard /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/secure-gpt-backend /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/secure-gpt-admin-frontend /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/secure-gpt-admin-backend /etc/nginx/sites-enabled/

nginx -t && systemctl enable nginx && systemctl restart nginx
print_info "Nginx configured ✓ (4 server blocks)"

# ==========================================
# STEP 9: Pull Images & Start Containers
# ==========================================
print_step "9/9: Pulling images and starting containers..."

docker compose pull
docker compose up -d

print_info "Waiting 60s for services to stabilize..."
sleep 60

# ==========================================
# SSL with Certbot (optional)
# ==========================================
echo ""
print_warn "Make sure ALL 4 DNS records point to this server before setting up SSL!"
echo "  $DASHBOARD_DOMAIN"
echo "  $API_DOMAIN"
echo "  $ADMIN_DASHBOARD_DOMAIN"
echo "  $ADMIN_API_DOMAIN"
echo ""
read -p "Set up SSL certificates now? (yes/no): " SSL_READY

if [ "$SSL_READY" = "yes" ]; then
    certbot --nginx \
        -d $DASHBOARD_DOMAIN \
        -d $API_DOMAIN \
        -d $ADMIN_DASHBOARD_DOMAIN \
        -d $ADMIN_API_DOMAIN \
        --non-interactive \
        --agree-tos \
        --email admin@rkavach.com \
        --redirect

    print_info "SSL certificates installed ✓"
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    print_info "SSL auto-renewal configured ✓"
else
    print_warn "Skipping SSL. Run manually later:"
    echo "  sudo certbot --nginx -d $DASHBOARD_DOMAIN -d $API_DOMAIN -d $ADMIN_DASHBOARD_DOMAIN -d $ADMIN_API_DOMAIN"
fi

# ==========================================
# Final Status
# ==========================================
echo ""
echo "=========================================="
echo "   ✅ SECUREGPT DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
print_info "🌐 Your Application:"
echo ""
echo "  Dashboard:       http://$DASHBOARD_DOMAIN"
echo "  Backend API:     http://$API_DOMAIN"
echo "  Health:          http://$API_DOMAIN/health"
echo "  Admin Dashboard: http://$ADMIN_DASHBOARD_DOMAIN"
echo "  Admin API:       http://$ADMIN_API_DOMAIN"
echo "  Admin Health:    http://$ADMIN_API_DOMAIN/health"
echo ""
print_info "📦 Container Status:"
docker compose ps
echo ""
print_info "📋 Useful Commands:"
echo "  Logs (all):             cd $DEPLOY_DIR && docker compose logs -f"
echo "  Logs (backend):         cd $DEPLOY_DIR && docker compose logs -f backend"
echo "  Logs (dashboard):       cd $DEPLOY_DIR && docker compose logs -f dashboard"
echo "  Logs (admin-backend):   cd $DEPLOY_DIR && docker compose logs -f admin-backend"
echo "  Logs (admin-frontend):  cd $DEPLOY_DIR && docker compose logs -f admin-frontend"
echo "  Restart all:            cd $DEPLOY_DIR && docker compose restart"
echo "  Stop all:                cd $DEPLOY_DIR && docker compose down"
echo "  Nginx status:            sudo systemctl status nginx"
echo ""
echo "=========================================="
