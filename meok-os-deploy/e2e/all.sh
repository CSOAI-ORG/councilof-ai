#!/usr/bin/env bash
# MEOK OS — full E2E matrix. Run: bash e2e/all.sh [base_url]
# Needs: npm i playwright && npx playwright install chromium webkit firefox (for the .cjs suites)
set -uo pipefail
B="${1:-https://os.meok.ai}"; here="$(cd "$(dirname "$0")"&&pwd)"; fail=0
echo "### 1/5 API smoke ###"; bash "$here/smoke.sh" "$B" || fail=1
for s in visual journey responsive apps xbrowser; do
  echo "### $s ###"; node "$here/$s.cjs" "$B" || fail=1
done
echo; [ "$fail" = 0 ] && echo "ALL E2E GREEN" || { echo "E2E RED"; exit 1; }
