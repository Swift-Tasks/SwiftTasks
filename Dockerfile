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
    npm ci --no-audit --prefer-offline --legacy-peer-deps; \
  else \
    npm install --no-audit --prefer-offline --legacy-peer-deps; \
  fi'

# Copy source
COPY . .

ENV NODE_ENV=production

# Build Next.js
RUN npx next build

RUN npx drizzle-kit generate
RUN npx drizzle-kit migrate
RUN npx drizzle-kit push

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

EXPOSE 3000

CMD ["node", "server.js"]
