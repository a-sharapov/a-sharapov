#!/bin/sh
set -e

UID_NUM="${UID:-0}"
GID_NUM="${GID:-0}"

for dir in pb_data pb_migrations pb_hooks; do
  mkdir -p "$dir"
  if ! chown -R "${UID_NUM}:${GID_NUM}" "$dir" 2>/dev/null; then
    echo "[cms-entrypoint] WARN: chown ${UID_NUM}:${GID_NUM} ${dir} failed (need CAP_CHOWN/DAC_OVERRIDE?)" >&2
  fi
  chmod -R u+rwX "$dir" 2>/dev/null || true
done

find pb_data -type f \( -name '*.db' -o -name '*.db-*' \) \
  -exec chmod u+rw {} \; 2>/dev/null || true

domain="${DOMAIN:-localhost}"

exec ./pocketbase serve \
  --dir=pb_data \
  --migrationsDir=pb_migrations \
  --hooksDir=pb_hooks \
  --http=0.0.0.0:5703 \
  --origins="https://${domain},https://www.${domain}"
