#!/usr/bin/env bash
set -euo pipefail

DIR="${1:?usage: receive.sh DIR REF [BRANCH]}"
REF="${2:?usage: receive.sh DIR REF [BRANCH]}"
BRANCH="${3:-master}"
BUNDLE="$DIR/.deploy/repository.bundle"
DEPLOYED="$DIR/.deploy/deployed"

die() {
  printf '::error::receive: %s\n' "$*" >&2
  exit 1
}

cd "$DIR"
[[ -f "$BUNDLE.next" ]] || die "нет $BUNDLE.next"
mv "$BUNDLE.next" "$BUNDLE"
git rev-parse --git-dir >/dev/null 2>&1 || git init -q
PREVIOUS_REF="$(cat "$DEPLOYED" 2>/dev/null || true)"
git cat-file -e "${PREVIOUS_REF:-0}^{commit}" 2>/dev/null || PREVIOUS_REF=""

for dir in cms/pb_migrations cms/pb_hooks; do
  if [[ -d "$DIR/$dir" && ! -O "$DIR/$dir" ]]; then
    docker run --rm -v "$DIR/$dir:/target:z" alpine:3.22 chown -R "$(id -u):$(id -g)" /target ||
      die "$dir принадлежит другому пользователю, chown не удался"
  fi
done

git fetch -q "$BUNDLE" HEAD || die "git fetch из бандла не удался — стек не тронут"
git cat-file -e "${REF}^{commit}" || die "в бандле нет $REF — стек не тронут"
git -c core.hooksPath=/dev/null checkout -q -f -B "$BRANCH" "$REF" || die "checkout $REF не удался — стек не тронут"
printf '[receive] %s → %s\n' "${PREVIOUS_REF:0:7}" "${REF:0:7}"

DEPLOY_REF="$REF" DEPLOY_PREVIOUS_REF="$PREVIOUS_REF" DEPLOY_BRANCH="$BRANCH" \
  exec bash "$DIR/scripts/deploy/server.sh"
