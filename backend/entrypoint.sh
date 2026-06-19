#!/bin/sh
set -e

echo "=========================================="
echo "  Clinical Sample Flow Backend Startup"
echo "=========================================="

echo ""
echo "[1/3] Waiting for PostgreSQL database..."

MAX_RETRIES=30
RETRY=0
MIGRATE_SUCCESS=0

while [ $RETRY -lt $MAX_RETRIES ]; do
  RETRY=$((RETRY + 1))
  echo "  Attempt $RETRY/$MAX_RETRIES: running database migration test..."
  if npx ts-node src/database/migrate.ts 2>&1; then
    echo "  ✓ Database is ready and migration succeeded!"
    MIGRATE_SUCCESS=1
    break
  fi
  echo "  ✗ Migration failed, will retry in 3 seconds..."
  sleep 3
done

if [ $MIGRATE_SUCCESS -ne 1 ]; then
  echo "ERROR: Database migration timed out after $MAX_RETRIES attempts"
  exit 1
fi

echo ""
echo "[2/3] Seeding database (if empty)..."
npx ts-node src/database/seed.ts || true

echo ""
echo "[3/3] Starting backend server..."
echo "  Server will listen on :19482"
echo ""

exec npm run start
