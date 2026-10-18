#!/usr/bin/env bash
set -euo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/seed-targets.sh"
REPO="$(mktemp -d)"
trap 'rm -rf "$REPO"' EXIT

git -C "$REPO" init -q
git -C "$REPO" config user.email test@example.com
git -C "$REPO" config user.name test
mkdir -p "$REPO/cms/seed/i18n" "$REPO/web"
echo '{}' >"$REPO/cms/seed/i18n/ru.json"
echo '[]' >"$REPO/cms/seed/pages.json"
echo '[]' >"$REPO/cms/seed/contacts.json"
echo a >"$REPO/web/file"
git -C "$REPO" add -A
git -C "$REPO" commit -qm base
BASE="$(git -C "$REPO" rev-parse HEAD)"

commit() {
  echo "$2" >"$REPO/$1"
  git -C "$REPO" commit -qam "$1"
  git -C "$REPO" rev-parse HEAD
}

expect() {
  local got
  got="$(bash "$SCRIPT" "$1" "$2" "$REPO")"
  [[ "$got" == "$3" ]] || {
    printf 'seed-targets: %s..%s — ждали «%s», получили «%s»\n' "${1:0:7}" "${2:0:7}" "$3" "$got" >&2
    exit 1
  }
}

expect "" "$BASE" "i18n,pages,contacts"
expect "0000000000000000000000000000000000000000" "$BASE" "i18n,pages,contacts"
expect "$BASE" "$BASE" ""
CODE="$(commit web/file b)"
expect "$BASE" "$CODE" ""
PAGES="$(commit cms/seed/pages.json '[1]')"
expect "$CODE" "$PAGES" "pages"
BOTH="$(commit cms/seed/i18n/ru.json '{"a":1}')"
BOTH="$(commit cms/seed/contacts.json '[2]')"
expect "$PAGES" "$BOTH" "i18n,contacts"
expect "$BASE" "$BOTH" "i18n,pages,contacts"

echo "seed-targets: OK"
