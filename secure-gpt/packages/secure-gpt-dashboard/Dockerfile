# ================================
# Stage 1: Dependencies
# ================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copy root workspace package files
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy package.json files for all workspace packages
COPY packages/shared/package*.json ./packages/shared/
COPY packages/detection/package*.json ./packages/detection/
COPY packages/ocr/package*.json ./packages/ocr/
COPY packages/extension/package*.json ./packages/extension/
COPY packages/secure-gpt-dashboard/package*.json ./packages/secure-gpt-dashboard/

# Install all workspace dependencies into root node_modules
RUN npm ci


# ================================
# Stage 2: Builder
# ================================
FROM node:20-alpine AS builder

WORKDIR /app

# Build-time args — NEXT_PUBLIC_* vars are baked in at build time by Next.js
ARG NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ARG NEXT_PUBLIC_APP_MODE=standard
ARG NODE_ENV=production

ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_MODE=$NEXT_PUBLIC_APP_MODE
ENV NODE_ENV=$NODE_ENV

# Copy root node_modules only (workspaces hoists everything here)
COPY --from=deps /app/node_modules ./node_modules

# Copy source for shared packages (dashboard depends on these)
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY packages/secure-gpt-dashboard ./packages/secure-gpt-dashboard

# Build shared package first
RUN cd packages/shared && npm run build --if-present

# Build Next.js dashboard
RUN cd packages/secure-gpt-dashboard && npm run build

# Debug: verify standalone output exists
RUN ls -la packages/secure-gpt-dashboard/.next/ && \
    ls -la packages/secure-gpt-dashboard/.next/standalone/ || echo "Standalone not found!"


# ================================
# Stage 3: Production Runner
# ================================
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user 
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy standalone output — server.js lives at packages/secure-gpt-dashboard/server.js
COPY --from=builder --chown=nextjs:nodejs /app/packages/secure-gpt-dashboard/.next/standalone ./

# Copy static assets to match the nested path server.js expects
COPY --from=builder --chown=nextjs:nodejs /app/packages/secure-gpt-dashboard/.next/static ./packages/secure-gpt-dashboard/.next/static

# Copy public folder to match the nested path
COPY --from=builder --chown=nextjs:nodejs /app/packages/secure-gpt-dashboard/public ./packages/secure-gpt-dashboard/public

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "packages/secure-gpt-dashboard/server.js"]