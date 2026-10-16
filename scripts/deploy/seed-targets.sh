#!/usr/bin/env bash
set -euo pipefail

PREVIOUS="${1:-}"
TARGET="${2:?usage: seed-targets.sh PREVIOUS_REF TARGET_REF [ROOT]}"
ROOT="${3:-$(cd "$(dirname "$0")/../.." && pwd)}"

changed() {
  [[ -z "$PREVIOUS" ]] ||
    ! git -C "$ROOT" cat-file -e "${PREVIOUS}^{commit}" 2>/dev/null ||
    ! git -C "$ROOT" diff --quiet "$PREVIOUS" "$TARGET" -- "$1"
}

targets=()
if changed cms/seed/i18n; then targets+=(i18n); fi
if changed cms/seed/pages.json; then targets+=(pages); fi
if changed cms/seed/contacts.json; then targets+=(contacts); fi

(
  IFS=,
  printf '%s\n' "${targets[*]}"
)
