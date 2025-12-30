# GardenSeedTracker Dockerfile
# Multi-stage build for optimized production image

# ==================== Dependencies Stage ====================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl openssl-dev
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# ==================== Builder Stage ====================
FROM node:20-alpine AS builder
# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PHASE=phase-production-build

# Build the application
RUN npm run build

# ==================== Runner Stage ====================
FROM node:20-alpine AS runner
# Install OpenSSL for Prisma runtime
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files for migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder /app/node_modules/esbuild ./node_modules/esbuild
COPY --from=builder /app/node_modules/@esbuild ./node_modules/@esbuild
COPY --from=builder /app/node_modules/get-tsconfig ./node_modules/get-tsconfig
COPY --from=builder /app/node_modules/resolve-pkg-maps ./node_modules/resolve-pkg-maps

# Create data directory for SQLite
# Note: The volume mount will override this, but we need the directory structure
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Create entrypoint script to initialize database and seed if empty
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'set -e' >> /app/entrypoint.sh && \
    echo '' >> /app/entrypoint.sh && \
    echo '# Ensure data directory exists and has correct permissions' >> /app/entrypoint.sh && \
    echo 'if [ ! -w /app/data ]; then' >> /app/entrypoint.sh && \
    echo '  echo "ERROR: /app/data is not writable. Please ensure the volume has correct permissions."' >> /app/entrypoint.sh && \
    echo '  echo "Run: docker volume rm garden-seed-tracker_garden_data && docker-compose up -d"' >> /app/entrypoint.sh && \
    echo '  exit 1' >> /app/entrypoint.sh && \
    echo 'fi' >> /app/entrypoint.sh && \
    echo '' >> /app/entrypoint.sh && \
    echo 'echo "Initializing database..."' >> /app/entrypoint.sh && \
    echo 'node /app/node_modules/prisma/build/index.js db push --skip-generate' >> /app/entrypoint.sh && \
    echo 'echo "Checking if database needs seeding..."' >> /app/entrypoint.sh && \
    echo 'if [ ! -f /app/data/.seeded ]; then' >> /app/entrypoint.sh && \
    echo '  echo "Running database seed..."' >> /app/entrypoint.sh && \
    echo '  node /app/node_modules/tsx/dist/cli.mjs prisma/seed.ts && touch /app/data/.seeded || echo "Seed failed, continuing..."' >> /app/entrypoint.sh && \
    echo 'else' >> /app/entrypoint.sh && \
    echo '  echo "Database already seeded"' >> /app/entrypoint.sh && \
    echo 'fi' >> /app/entrypoint.sh && \
    echo 'echo "Database ready!"' >> /app/entrypoint.sh && \
    echo 'exec node server.js' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh && \
    chown nextjs:nodejs /app/entrypoint.sh

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set default environment variables
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/garden.db"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application with entrypoint
CMD ["/app/entrypoint.sh"]
