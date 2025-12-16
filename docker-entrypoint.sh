#!/bin/sh
set -e

echo "Running SQLite migrations..."
npm run db

echo "Starting Next.js server..."
exec node server.js
