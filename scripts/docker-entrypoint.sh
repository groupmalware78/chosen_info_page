#!/bin/sh
# Mounted volumes (e.g. on Railway) are owned by root. Fix ownership of the data
# directory, then drop privileges and run the app as the unprivileged "node" user.
set -e
DATA_DIR="${DATA_DIR:-/data}"

if [ "$(id -u)" = "0" ]; then
  mkdir -p "$DATA_DIR"
  chown -R node:node "$DATA_DIR"
  exec su-exec node "$@"
fi

exec "$@"
