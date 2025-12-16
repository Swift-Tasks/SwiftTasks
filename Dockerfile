# ----------------------------
# Builder stage
# ----------------------------
FROM node:20-bullseye AS builder
WORKDIR /app

RUN npm install -g npm@10.8.2

RUN apt-get update && \
    apt-get install -y python3 make g++ git && \
    rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./

RUN sh -c '\
  if [ -f package-lock.json ]; then \
    npm ci --no-audit --prefer-offline --legacy-peer-deps; \
  else \
    npm install --no-audit --prefer-offline --legacy-peer-deps; \
  fi'

COPY . .

ENV NODE_ENV=production
RUN npx next build

# ----------------------------
# Runtime stage
# ----------------------------
FROM node:20-bullseye-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy drizzle config + migrations + entrypoint
COPY --from=builder /app/drizzle.config.* ./ 
COPY --from=builder /app/drizzle/migrations ./migrations 
COPY --from=builder /app/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh  

EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
