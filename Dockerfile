# Builder stage: use Node to build Next.js (avoid Bun build runtime issues)
FROM node:20-bullseye AS builder
WORKDIR /app

# Install system build deps for native modules if needed
RUN apt-get update && \
    apt-get install -y python3 make g++ git && \
    rm -rf /var/lib/apt/lists/*

# Copy package manifests first for better caching
# Use a wildcard so COPY doesn't fail if package-lock.json is missing
COPY package*.json ./
# Prefer `npm ci` when a lockfile is present, otherwise fall back to `npm install`
RUN sh -c "if [ -f package-lock.json ]; then npm ci --no-audit --prefer-offline; else npm install --no-audit --prefer-offline; fi"

# Copy rest of the source
COPY . .

ENV NODE_ENV=production
# Build the Next.js app
RUN npx next build

# Runtime stage: use Node to run the Next.js standalone server
FROM node:20-bullseye-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy Next.js standalone output and required files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.env* ./

EXPOSE 3000
# The standalone output contains a server.js entrypoint
CMD ["node", "server.js"]

