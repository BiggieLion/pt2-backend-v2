# ============================================
# Stage 1: Base - Common dependencies
# ============================================
FROM node:lts-alpine AS base

WORKDIR /usr/src/app

# Installing dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copying package files
COPY package*.json ./

# ================================================
# Stage 2: Development - With source code mounting
# ================================================
FROM base AS development

# Install ALL dependencies (including dev dependencies)
RUN npm i

# Copy source code (will be overridden by volume mount in docker-compose)
COPY . .

# Exposing port
EXPOSE 3000

# Use dumb-init and run in watch mode
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start:dev"]

# ============================================
# Stage 3: Builder - Compile TypeScript
# ============================================
FROM base AS builder

# Install all dependencies for building
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# ============================================
# Stage 4: Production - Minimal runtime
# ============================================
FROM node:lts-alpine AS production

# Install dumb-init and create non-root user
RUN apk add --no-cache dumb-init && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /usr/src/app

# Copy production dependencies
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/package*.json ./

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]