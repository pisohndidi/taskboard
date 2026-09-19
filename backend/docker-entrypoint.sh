#!/bin/sh
set -e

echo "==> Running database migration..."
node src/db/migrate.js

echo "==> Running database seed..."
node src/db/seed.js

echo "==> Starting server..."
exec node src/server.js