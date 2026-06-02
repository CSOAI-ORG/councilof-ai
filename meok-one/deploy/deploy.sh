#!/usr/bin/env bash
# MEOK ONE — push the app to the VM and restart. Idempotent. Run from the meok-one/ dir.
#
#   ./deploy/deploy.sh [SSH_HOST]      # SSH_HOST defaults to "meok-backend"
#
# Assumes the one-time setup in DEPLOY.md is done (user `meok`, /opt/meok-one, systemd unit,
# Caddy site). Pure-stdlib app → no pip install step. Verifies health before declaring success.
set -euo pipefail

HOST="${1:-meok-backend}"
REMOTE="/opt/meok-one"

echo "→ MEOK ONE deploy to ${HOST}:${REMOTE}"

# 1. sync the app (package + project metadata). Never ship caches / node_modules / test output.
rsync -az --delete --rsync-path="sudo rsync" \
  --exclude '__pycache__' --exclude '*.pyc' \
  --exclude 'e2e/node_modules' --exclude 'e2e/test-results' --exclude 'e2e/results.json' \
  --exclude '.env' \
  --exclude 'data/users.json' --exclude 'data/vitals.json' --exclude 'data/*.jsonl' \
  ./meok_one ./pyproject.toml ./README.md \
  "${HOST}:${REMOTE}/"
# ^ runtime state (accounts, vitals, SIGIL audit chain, perception + law registries) lives ONLY
#   on the VM — never clobber it from a dev copy. law_bundle.json IS source, so it still ships.

# 2. restart + health-gate (fails loudly if the new code doesn't come up)
ssh "${HOST}" bash -s <<'REMOTE_EOF'
set -euo pipefail
# `sudo rsync` writes files as root; the service runs as `meok`. Restore ownership so the app
# can write its runtime state (users.json, audit/perception logs) — else /api/auth/anon 500s.
sudo chown -R meok:meok /opt/meok-one
sudo systemctl restart meok-one
sleep 2
systemctl is-active --quiet meok-one || { echo "✗ service not active"; sudo journalctl -u meok-one -n 30 --no-pager; exit 1; }
code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4173/api/health || true)
[ "$code" = "200" ] || { echo "✗ /api/health returned $code"; exit 1; }
echo "✓ meok-one live (health 200)"
REMOTE_EOF

echo "✓ deployed. Public: check your Caddy hostname (e.g. https://one.meok.ai/os)"
