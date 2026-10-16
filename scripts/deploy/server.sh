#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
REF="${DEPLOY_REF:-$(git -C "$ROOT" rev-parse HEAD)}"
PREVIOUS_REF="${DEPLOY_PREVIOUS_REF:-}"
BRANCH="${DEPLOY_BRANCH:-master}"
RETRIES="${DEPLOY_HEALTH_RETRIES:-60}"
DELAY="${DEPLOY_HEALTH_DELAY:-2}"
APP=(web bot cms)
DC=(docker compose -f "$ROOT/prod.yml")
MAKE=(make --no-print-directory -C "$ROOT")
DEPLOYED="$ROOT/.deploy/deployed"

log() { printf '[deploy] %s\n' "$*"; }
warn() { printf '::warning::deploy: %s\n' "$*"; }
die() {
  printf '::error::deploy: %s\n' "$*" >&2
  exit 1
}

cd "$ROOT"
[[ -f .env ]] || die "нет $ROOT/.env: make dot-env ENV=prod, вписать TG_TOKEN, chmod 600 .env — стек не тронут"
mode="$(stat -c '%a' .env)"
((8#$mode & 077)) && die ".env открыт группе или всем ($mode): chmod 600 .env — стек не тронут"

log "env"
"${MAKE[@]}" env ENV=prod
"${MAKE[@]}" env-check ENV=prod || die "env-check: исправьте .env — стек не тронут"

log "build ${APP[*]} at ${REF:0:7}"
"${DC[@]}" build "${APP[@]}" || die "сборка не удалась — стек не тронут"

up() {
  "${DC[@]}" up -d --remove-orphans "${APP[@]}" &&
    "${DC[@]}" up -d proxy &&
    "${DC[@]}" exec -T proxy caddy reload --config /etc/caddy/Caddyfile
}

healthy() {
  local status=missing
  for ((i = 1; i <= RETRIES; i++)); do
    status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' a-sharapov_web 2>/dev/null || echo missing)"
    [[ "$status" == healthy ]] && log "web healthy" && return 0
    sleep "$DELAY"
  done
  log "web: $status"
  docker logs --tail 30 a-sharapov_web 2>&1 || true
  return 1
}

smoke() {
  local domain port base
  domain="$(bun scripts/env/generate.ts --mode prod get DOMAIN)"
  port="$(bun scripts/env/generate.ts --mode prod get PROXY_HTTPS_PORT)"
  base="https://$domain:$port"
  curl -fsS -k -o /dev/null --max-time 15 --resolve "$domain:$port:127.0.0.1" "$base/" &&
    curl -fsS -k --max-time 15 --resolve "$domain:$port:127.0.0.1" "$base/api/health" | grep -q '"ok":true' &&
    log "smoke: $base/ и /api/health через proxy"
}

rollback() {
  [[ -n "$PREVIOUS_REF" && "$PREVIOUS_REF" != "$REF" ]] || die "$1; предыдущей версии нет — откатываться некуда"
  warn "$1 — откат на ${PREVIOUS_REF:0:7}"
  git -c core.hooksPath=/dev/null checkout -q -f -B "$BRANCH" "$PREVIOUS_REF"
  if "${DC[@]}" build "${APP[@]}" && up && healthy; then
    die "$1 — выкатка ${REF:0:7} отменена, работает ${PREVIOUS_REF:0:7}"
  fi
  die "$1 — откат на ${PREVIOUS_REF:0:7} не поднял сайт, нужна ручная проверка"
}

seed() {
  local only cms_ip
  only="$(bash scripts/deploy/seed-targets.sh "$PREVIOUS_REF" "$REF")"
  [[ -n "$only" ]] || {
    log "сиды не менялись"
    return 0
  }
  cms_ip="$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' a-sharapov_cms)"
  log "сиды: $only"
  "${MAKE[@]}" cms-seed ENV=prod CMS_URL="http://$cms_ip:5703" ONLY="$only" ||
    warn "сиды ($only) не записаны — make cms-seed ENV=prod вручную"
}

log "up ${APP[*]}, proxy reload"
up || rollback "контейнеры не запустились"
healthy || rollback "web не стал healthy"
seed
smoke || rollback "smoke через proxy не прошёл"

printf '%s\n' "$REF" >"$DEPLOYED"
docker image prune -f >/dev/null || true
log "done ${REF:0:7}"
