# ----------------------------
# Builder stage
# ----------------------------
FROM node:20-bullseye AS builder
WORKDIR /app

# Pin npm (npm 11 is stricter and breaks more builds)
RUN npm install -g npm@10.8.2

# System deps for native modules
RUN apt-get update && \
    apt-get install -y python3 make g++ git && \
    rm -rf /var/lib/apt/lists/*

# Copy manifests first
COPY package.json package-lock.json* ./

# Install deps (works with or without lockfile)
RUN sh -c '\
  if [ -f package-lock.json ]; then \
    npm ci --no-audit --legacy-peer-deps; \
  else \
    npm install --no-audit --legacy-peer-deps; \
  fi'

# Rebuild native modules to ensure platform-specific binaries are correctly installed
RUN npm rebuild

# Copy source
COPY . .

ENV NODE_ENV=production

# Build Next.js
RUN npx next build

# ----------------------------
# Runtime stage
# ----------------------------
FROM node:20-bullseye-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy only what Next standalone needs
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy migration files and scripts
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/scripts/migrate.ts ./scripts/migrate.ts
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/package.json ./package.json

# Copy and enable entrypoint script
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Install tsx for running TypeScript migration script
RUN npm install --omit=dev tsx

# Create data directory for database file
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["./docker-entrypoint.sh"]