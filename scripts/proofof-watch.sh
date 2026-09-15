#!/usr/bin/env bash
# proofof-watch.sh — proofof.ai endpoint scanner.
#
# G1.4 PROOFOF WATCH (TUI-1 INTEGRITY). Checks all proofof.ai and bodies.ai
# endpoints. Results are honest: 200 = LIVE, 301 = REDIRECT (followed),
# 000 = UNREACHABLE, other = FAIL.
#
# Usage:
#   bash scripts/proofof-watch.sh              # human-readable
#   bash scripts/proofof-watch.sh --json        # machine-readable JSON
#
# Exit codes: 0 all green; 1 at least one failure; 2 usage error.
set -uo pipefail

BASE_POF="https://proofof.ai"
BASE_BODIES="https://bodies.ai"
TIMEOUT=15
PASS=0
FAIL=0
UNREACHABLE=0
RESULTS=""

check() {
  local desc="$1" url="$2"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time "$TIMEOUT" "$url" 2>/dev/null)
  if [ "$code" = "000" ]; then
    UNREACHABLE=$((UNREACHABLE+1))
    RESULTS="$RESULTS{\"endpoint\":\"$desc\",\"url\":\"$url\",\"status\":\"UNREACHABLE\",\"http_code\":\"000\"},"
  elif [ "$code" = "200" ] || [ "$code" = "301" ]; then
    PASS=$((PASS+1))
    RESULTS="$RESULTS{\"endpoint\":\"$desc\",\"url\":\"$url\",\"status\":\"LIVE\",\"http_code\":\"$code\"},"
  else
    FAIL=$((FAIL+1))
    RESULTS="$RESULTS{\"endpoint\":\"$desc\",\"url\":\"$url\",\"status\":\"FAIL\",\"http_code\":\"$code\"},"
  fi
}

JSON_MODE=false
if [ "${1:-}" = "--json" ]; then JSON_MODE=true; fi

if [ "$JSON_MODE" = false ]; then
  echo "=== PROOFOF WATCH $(date -u +%FT%TZ) ==="
fi

# proofof.ai endpoints (301 → councilof.ai is expected and correct)
check "proofof.ai (apex)" "$BASE_POF"
check "proofof.ai/receipt" "$BASE_POF/receipt"
check "proofof.ai/root.json" "$BASE_POF/root.json"
check "proofof.ai/did.json" "$BASE_POF/.well-known/did.json"

# bodies.ai endpoints (separate domain, currently down)
check "bodies.ai (apex)" "$BASE_BODIES"
check "bodies.ai/receipt" "$BASE_BODIES/receipt"
check "bodies.ai/root.json" "$BASE_BODIES/root.json"

if [ "$JSON_MODE" = true ]; then
  RESULTS="${RESULTS%,}"
  echo "{\"as_of\":\"$(date -u +%FT%TZ)\",\"pass\":$PASS,\"fail\":$FAIL,\"unreachable\":$UNREACHABLE,\"endpoints\":[$RESULTS]}"
else
  echo ""
  echo "=== RESULT: PASS=$PASS FAIL=$FAIL UNREACHABLE=$UNREACHABLE $(date -u +%FT%TZ) ==="
fi

if [ $FAIL -gt 0 ]; then exit 1; fi
exit 0
