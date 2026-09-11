#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
umask 077
mkdir -p backups
archive="backups/veio-torto-$(date -u +%Y%m%dT%H%M%SZ)-$$.tar.gz"
docker compose --env-file .env.vps stop website
trap 'docker compose --env-file .env.vps start website >/dev/null' EXIT
docker compose --env-file .env.vps run --rm --no-deps -T --entrypoint tar website -czf - -C /data . > "$archive"
tar -tzf "$archive" >/dev/null
printf 'Backup: %s\n' "$archive"
