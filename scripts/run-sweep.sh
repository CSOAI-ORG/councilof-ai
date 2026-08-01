#!/usr/bin/env bash
# run-sweep.sh — build client, serve, run the surface sweep, merge the report.
# Usage: bash scripts/run-sweep.sh
set -uo pipefail
cd "$(dirname "$0")/.."

echo "=== build:client $(date +%H:%M:%S) ==="
npm run build:client 2>&1 | tail -4 || { echo "BUILD FAILED"; exit 1; }

echo "=== preview + sweep $(date +%H:%M:%S) ==="
npx vite preview --config client/vite.config.ts --port 4173 --strictPort >/tmp/sweep-preview.log 2>&1 &
PREVIEW_PID=$!
trap 'kill $PREVIEW_PID 2>/dev/null' EXIT
sleep 4

BASE_URL=http://localhost:4173 npx playwright test --config e2e/playwright.config.ts surface-sweep --project=chromium --reporter=line 2>&1 | tail -8
SWEEP_RC=$?

kill $PREVIEW_PID 2>/dev/null
wait $PREVIEW_PID 2>/dev/null

echo "=== merge report ==="
node scripts/sweep-report.mjs
exit $SWEEP_RC
