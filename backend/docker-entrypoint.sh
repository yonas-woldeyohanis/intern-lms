#!/bin/sh

# Exit on error (but we handle migration errors manually below)
set -e

echo "Running database migrations..."
# Use || to gracefully skip if tables already exist (safe on restart)
node database/migrate.js || echo "[INFO] Migration skipped — tables already exist (this is normal on restart)"

echo "Running database seed (ensures admin user exists)..."
node database/seed.js

echo "Starting backend server..."
exec npm start
