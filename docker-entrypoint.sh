#!/bin/sh
set -e

echo "🔄 Running database migrations..."
npx tsx scripts/migrate.ts

echo "Starting Next.js server..."
exec node server.js
