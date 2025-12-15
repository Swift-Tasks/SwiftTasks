FROM oven/bun:1.1.13 AS builder
WORKDIR /app


# Install Python and build tools for node-gyp dependencies
RUN apt-get update && apt-get install -y python3 make g++ && ln -sf python3 /usr/bin/python

# Patch for oniguruma/node-gyp build error
ENV npm_config_enable_lto=""

# Install dependencies only when needed
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the Next.js app
RUN bun run build

FROM oven/bun:1.1.13 AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only built output and node_modules from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lockb* ./
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/tsconfig.json ./

# Use non-root user for security
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser /app
USER appuser

EXPOSE 3000
CMD ["bun", "run", "start"]
