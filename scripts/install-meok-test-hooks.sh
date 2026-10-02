#!/usr/bin/env bash
# Install MEOK proxy-path test hooks into the active git hooks location.
# core.hooksPath (~/.config/git/hooks) wins over .git/hooks.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

HOOKS_PATH="$(git config core.hooksPath || true)"
if [[ -z "$HOOKS_PATH" ]]; then
  HOOKS_PATH="$ROOT/.git/hooks"
fi
mkdir -p "$HOOKS_PATH"

install_hook() {
  local name="$1"
  local src="$ROOT/.githooks/$name"
  local dst="$HOOKS_PATH/$name"
  if [[ ! -f "$src" ]]; then
    echo "missing $src" >&2
    exit 1
  fi
  cp "$src" "$dst"
  chmod +x "$dst"
  echo "installed $dst"
}

install_hook pre-commit
install_hook pre-push

if [[ "$HOOKS_PATH" != "$ROOT/.git/hooks" ]]; then
  cp "$ROOT/.githooks/pre-commit" "$ROOT/.git/hooks/pre-commit"
  chmod +x "$ROOT/.git/hooks/pre-commit"
  echo "synced $ROOT/.git/hooks/pre-commit"
fi

echo "MEOK proxy-path test hooks installed (hooksPath=$HOOKS_PATH)"
echo "  pre-commit: required unit tests on EVERY commit"
echo "  pre-push:   required full suite (16) on every push"
echo "  Optional local interceptor (blocks --no-verify):"
echo "    export PATH=\"$ROOT/scripts/bin:\$PATH\""
