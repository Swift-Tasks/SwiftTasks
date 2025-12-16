#!/bin/sh
set -e

echo "Ensuring data directory exists..."
mkdir -p /app/data

echo "Running SQLite migrations..."
npx drizzle-kit migrate

echo "Starting Next.js server..."
exec node server.js
