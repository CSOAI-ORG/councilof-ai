#!/usr/bin/env bash
# Install MEOK proxy-path test hooks into the active git hooks location.
# The repo uses core.hooksPath (~/.config/git/hooks) — that wins over .git/hooks.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

HOOKS_PATH="$(git config core.hooksPath || true)"
if [[ -z "$HOOKS_PATH" ]]; then
  HOOKS_PATH="$ROOT/.git/hooks"
fi
mkdir -p "$HOOKS_PATH"

# Preserve existing LFS pre-push by chaining it inside our pre-push template.
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

# Also keep .git/hooks/pre-commit in sync (used if hooksPath is ever unset)
if [[ "$HOOKS_PATH" != "$ROOT/.git/hooks" ]]; then
  cp "$ROOT/.githooks/pre-commit" "$ROOT/.git/hooks/pre-commit"
  chmod +x "$ROOT/.git/hooks/pre-commit"
  echo "synced $ROOT/.git/hooks/pre-commit"
fi

echo "MEOK proxy-path test hooks installed (hooksPath=$HOOKS_PATH)"
echo "  pre-commit: runs 16 tests when meok/ is staged"
echo "  pre-push:   runs 16 tests on every push"
