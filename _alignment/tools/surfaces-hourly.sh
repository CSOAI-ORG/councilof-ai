#!/usr/bin/env bash
# SURFACES hourly probe contract (TUI-2).
# Wrappers MUST use curl -sL: bare /wrappers answers 308 with an empty body;
# without -L the parity count is a false 0. Count is always derived, never retyped.
set -euo pipefail

ROOT="${SURFACE_ROOT:-/tmp/coai-surface}"
REPO="${SURFACE_REPO:-https://github.com/CSOAI-ORG/councilof-ai.git}"
STATUS="${SURFACE_STATUS:-$HOME/clawd/_alignment/STATUS-tui2-surfaces-$(date -u +%F).md}"
TS="$(date -u +%Y-%m-%dT%H:%MZ)"
BRANCH="tui2/surfaces-$(date -u +%Y%m%d%H%M)"

if [ ! -d "$ROOT/.git" ]; then
  git clone --depth 50 "$REPO" "$ROOT"
fi
cd "$ROOT"
git fetch origin master --depth 50
git checkout -b "$BRANCH" origin/master

echo "== checks =="
node scripts/surface/static-shell.mjs --check
node scripts/brand-gate.mjs public
if [ -d node_modules ]; then
  npx vitest run functions/api/_no_typed_prices.test.ts
else
  echo "WARN: node_modules missing — run npm ci before vitest" >&2
fi

echo "== typed counts =="
rg -n -i 'typed.?price|typed_price|typedPrice' . \
  --glob '!node_modules/**' --glob '!*.lock' || true

echo "== live probes =="
# -sL required: /wrappers is 308 → /wrappers/
WRAPPERS_COUNT="$(curl -sL --max-time 20 https://councilof.ai/wrappers | grep -c 'Wrapped-asset parity' || true)"
REVENUE_LINE="$(curl -sL --max-time 20 https://councilof.ai/press | rg -n 'Revenue:|0\.02 USDC' | head -5 || true)"
echo "wrappers_parity_count=$WRAPPERS_COUNT (curl -sL; bare curl -s is a false 0)"
echo "press_revenue:"
echo "$REVENUE_LINE"

{
  echo
  echo "## SURFACES Hourly — $TS"
  echo "| Check | Result |"
  echo "|---|---|"
  echo "| static-shell | PASS or RED→see above |"
  echo "| brand-gate | see above |"
  echo "| _no_typed_prices | see above |"
  echo "- Wrappers (curl -sL): ${WRAPPERS_COUNT} \"Wrapped-asset parity\""
  echo "- Revenue probe: 0.02 USDC expected unless press line says otherwise"
  echo "- Branch: \`$BRANCH\`"
  echo "- Probe contract: wrappers uses \`curl -sL\` (308 on bare /wrappers)"
} >> "$STATUS"
echo "STATUS appended: $STATUS"
