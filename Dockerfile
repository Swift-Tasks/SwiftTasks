FROM oven/bun:1.1.13 AS builder
WORKDIR /app

# Install Python and build tools with proper configuration
RUN apt-get update && \
    apt-get install -y python3 python3-dev make g++ git && \
    rm -rf /var/lib/apt/lists/*

# Set Python environment variables for node-gyp
ENV PYTHON=/usr/bin/python3
ENV npm_config_python=/usr/bin/python3
ENV npm_config_enable_lto=""

# Install dependencies only when needed
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the Next.js app
RUN bun run build

# Use Node.js for runtime (more stable for Next.js production)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy only built output and node_modules from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/node_modules ./node_modules

# Use non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node_modules/.bin/next", "start"]