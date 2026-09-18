#!/bin/sh
set -eu

if ! awk '$5 == "/app/data" { found = 1 } END { exit !found }' /proc/self/mountinfo; then
  echo 'ERROR: Mount a persistent host directory or Docker volume at /app/data before starting GST.' >&2
  exit 1
fi

# SQLite must live on the persistent mount, never in the application image.
case "${DATABASE_URL:-}" in
  file:/app/data/*) ;;
  *) echo 'ERROR: DATABASE_URL must point to file:/app/data/<name>.db on the persistent data mount.' >&2; exit 1 ;;
esac
db_path=${DATABASE_URL#file:}
case "$db_path" in
  *'?'*|*'/../'*|*'/./'*) echo 'ERROR: Use an absolute database path without query parameters or dot segments.' >&2; exit 1 ;;
esac
if [ ! -w "$(dirname "$db_path")" ]; then
  echo 'ERROR: Database directory is not writable by UID 1001. Fix the existing mount ownership; do not delete the database or volume.' >&2
  exit 1
fi

# SQLite online backup includes committed WAL data. Keep backups outside the image.
if [ -s "$db_path" ]; then
  mkdir -p /app/data/backups
  backup="/app/data/backups/garden-$(date -u +%Y%m%dT%H%M%SZ)-$$.db"
  sqlite3 "$db_path" ".timeout 30000" ".backup '$backup'"
  echo "Database backup: $backup"
fi

# Prisma 6 SQLite schema initialization expects the file to exist on some platforms.
if [ ! -e "$db_path" ]; then
  (umask 077; touch "$db_path")
fi

# Apply reviewed migrations; adopt older installations without dropping legacy settings.
node /app/node_modules/tsx/dist/cli.mjs scripts/database/initialize.ts
node /app/node_modules/tsx/dist/cli.mjs prisma/seed.ts
exec node server.js
