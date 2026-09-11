#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
connector="${1:-cloudflared}"
mode="$(docker inspect --format '{{.HostConfig.NetworkMode}}' "$connector")"
if [[ "$mode" == "host" ]]; then
  port="$(docker compose --env-file .env.vps port website 3000)"
  printf '\nCloudflared usa a rede host. Service URL: http://%s\n' "$port"
  exit 0
fi
if [[ "$mode" == container:* || "$mode" == "none" ]]; then
  printf 'Modo de rede %s requer configuração específica; não foi alterado.\n' "$mode" >&2
  exit 1
fi
docker network inspect veio-torto-tunnel >/dev/null
attached="$(docker inspect --format '{{if index .NetworkSettings.Networks "veio-torto-tunnel"}}yes{{end}}' "$connector")"
if [[ "$attached" != "yes" ]]; then
  docker network connect veio-torto-tunnel "$connector"
fi
printf '\nCloudflared ligado à rede do Veio Torto. Service URL: http://veio-torto-web:3000\n'
printf 'Esta ligação sobrevive a reinícios, mas deve ser declarada no Compose/Portainer do cloudflared para sobreviver à recriação. Consulte VPS.md.\n'
