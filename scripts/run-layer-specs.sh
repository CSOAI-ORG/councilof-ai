#!/usr/bin/env bash
# run-layer-specs.sh — build, serve EXCLUSIVELY, run the Sov Space layer specs.
set -uo pipefail
cd "$(dirname "$0")/.."

pkill -f "vite preview" 2>/dev/null; sleep 1

echo "=== build:client $(date +%H:%M:%S) ==="
npm run build:client 2>&1 | tail -3 || exit 1

npx vite preview --config client/vite.config.ts --port 4173 --strictPort >/tmp/layer-preview.log 2>&1 &
PREVIEW_PID=$!
trap 'kill $PREVIEW_PID 2>/dev/null' EXIT

for i in $(seq 1 15); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4173/ 2>/dev/null)
  [ "$code" = "200" ] && break
  sleep 4
done
echo "preview-up: ${code:-000}"

BASE_URL=http://localhost:4173 npx playwright test --config e2e/playwright.config.ts sovspace-layers --project=chromium --reporter=line 2>&1 | tail -12
RC=${PIPESTATUS[0]}
kill $PREVIEW_PID 2>/dev/null
exit $RC
