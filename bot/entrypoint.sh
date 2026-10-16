#!/bin/sh
set -e

DATA_DIR="${PWD}/data"
UID_NUM="${UID:-1000}"
GID_NUM="${GID:-1000}"

if [ "$(id -u)" != "0" ]; then
  exec "$@"
fi

mkdir -p "$DATA_DIR"

if ! chown -R "${UID_NUM}:${GID_NUM}" "$DATA_DIR" 2>/dev/null; then
  echo "[bot-entrypoint] WARN: chown ${UID_NUM}:${GID_NUM} ${DATA_DIR} failed" >&2
fi

chmod u+rwx "$DATA_DIR" 2>/dev/null || true
find "$DATA_DIR" -type f -name '*.db*' -exec chmod u+rw {} \; 2>/dev/null || true

if command -v gosu >/dev/null 2>&1; then
  exec gosu "${UID_NUM}:${GID_NUM}" "$@"
fi

if command -v su-exec >/dev/null 2>&1; then
  exec su-exec "${UID_NUM}:${GID_NUM}" "$@"
fi

echo "[bot-entrypoint] ERROR: no gosu/su-exec — refusing to run app as root" >&2
exit 1
