#!/bin/sh
set -e

echo "🚀 [AI Studio] Starting Backend Container..."
echo "⏳ Waiting for MySQL database to become ready..."

MAX_RETRIES=30
RETRY_COUNT=0

until npx prisma db push --skip-generate; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "❌ Failed to connect to MySQL after $MAX_RETRIES attempts. Exiting."
    exit 1
  fi
  echo "⚠️ Database not reachable yet ($RETRY_COUNT/$MAX_RETRIES), retrying in 3 seconds..."
  sleep 3
done

echo "✅ Database schema synchronized successfully!"

echo "🌱 Running database seeds (admin, creator, prompt library, models)..."
npx ts-node prisma/seed.ts || echo "Seed already completed or skipped."

# Locate the compiled main entry file
if [ -f "dist/src/main.js" ]; then
  MAIN_FILE="dist/src/main.js"
elif [ -f "dist/main.js" ]; then
  MAIN_FILE="dist/main.js"
else
  MAIN_FILE="dist/main"
fi

echo "🚀 Launching NestJS Server: node $MAIN_FILE on port ${PORT:-3000}..."
exec node "$MAIN_FILE"
