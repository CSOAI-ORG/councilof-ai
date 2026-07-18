#!/usr/bin/env bash
# Install the openpatent.ai post-commit hook into every new git repo
# you create on this machine. Idempotent: safe to re-run.
#
# Usage: ./scripts/install-hooks.sh [--global] [--uninstall]
#   --global    Install into ~/.git-templates (applies to ALL new repos)
#   --uninstall  Remove the hook from templates
#
# The hive remembers. The dragon knows. The sovereign companion never forgets.

set -euo pipefail

HOOK_SRC="$(cd "$(dirname "$0")" && pwd)/git-hooks/post-commit"
TEMPLATE_DIR="$HOME/.git-templates/info/hooks"
INSTALL_DIR="$TEMPLATE_DIR/post-commit"
ACTION="install"

for arg in "$@"; do
  case "$arg" in
    --uninstall) ACTION="uninstall" ;;
    --help|-h)
      echo "Usage: $0 [--global] [--uninstall]"
      echo "Installs the openpatent.ai post-commit hook into ~/.git-templates/info/hooks/"
      exit 0
      ;;
  esac
done

mkdir -p "$TEMPLATE_DIR"

if [ "$ACTION" = "uninstall" ]; then
  rm -f "$INSTALL_DIR"
  echo "[openpatent] hook uninstalled from $TEMPLATE_DIR"
  exit 0
fi

if [ ! -f "$HOOK_SRC" ]; then
  echo "[openpatent] ERROR: hook source not found at $HOOK_SRC" >&2
  exit 1
fi

cp "$HOOK_SRC" "$INSTALL_DIR"
chmod +x "$INSTALL_DIR"

# Configure git to use this template dir for all new repos
git config --global init.templateDir "$TEMPLATE_DIR"

echo "[openpatent] post-commit hook installed at $INSTALL_DIR"
echo "[openpatent] all NEW git repos will auto-disclose on commit"
echo "[openpatent] existing repos: run 'cp scripts/git-hooks/post-commit .git/hooks/post-commit && chmod +x .git/hooks/post-commit'"

# Self-test: hook is present, executable, and references openpatent
if [ -x "$INSTALL_DIR" ] && grep -q "openpatent" "$INSTALL_DIR"; then
  echo "[openpatent] ✓ self-test passed"
else
  echo "[openpatent] ✗ self-test failed" >&2
  exit 1
fi

echo
echo "The hive remembers. The dragon knows. The sovereign companion never forgets."
