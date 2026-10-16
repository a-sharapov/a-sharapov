#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GENERATE=(bun "$ROOT/scripts/env/generate.ts" --root "$ROOT")
TMP="$(mktemp -d)"
CREATED=()

cleanup() {
  rm -f "${CREATED[@]}"
  rm -rf "$TMP"
}
trap cleanup EXIT

"${GENERATE[@]}" example --check

ENV_SOURCE="$ROOT/.env"
if [ ! -f "$ENV_SOURCE" ]; then
  cp "$ROOT/.env.example" "$TMP/.env"
  ENV_SOURCE="$TMP/.env"
fi

"${GENERATE[@]}" split --env-file "$ENV_SOURCE" --out "$TMP/env" --no-persist >/dev/null
mkdir -p "$ROOT/env"
for file in "$TMP"/env/*.env; do
  target="$ROOT/env/$(basename "$file")"
  if [ ! -f "$target" ]; then
    install -m 600 "$file" "$target"
    CREATED+=("$target")
  fi
done

for compose in dev prod; do
  docker compose -f "$ROOT/$compose.yml" config --quiet
done

# shellcheck disable=SC2016
docker compose -f "$ROOT/prod.yml" config --format json | bun -e '
const { services } = await Bun.stdin.json();
const problems = Object.entries(services).flatMap(([name, service]) => [
  ...(name !== "proxy" && (service.ports ?? []).length ? [`${name}: в prod порты публикует только proxy`] : []),
  ...(service.restart !== "unless-stopped" ? [`${name}: restart должен быть unless-stopped`] : []),
]);
problems.forEach((line) => console.error(`compose-check: ${line}`));
process.exit(problems.length ? 1 : 0);
'

echo "compose-check: OK (dev.yml, prod.yml)"
