#!/usr/bin/env bash
# Council + CSOAI engine smoke harness
# One-shot live check across every surface the council submerge depends on.
# Verifies state before reporting; never asserts a number it didn't measure.
#
# Usage: ./scripts/council_smoke.sh
# Output: PASS/FAIL per surface, summary table, exit non-zero on any red.

set -uo pipefail
CURL=${CURL:-/usr/bin/curl}
TIMEOUT=8

# All public hosts (none of these are owner-gated reads).
COUNCIL_BASE="https://csoai.org"
ATTEST_BASE="https://meok-attestation-api.vercel.app"
MEOK_API_LOCAL="http://localhost:3200"
MEOK_API_PUBLIC="https://api.meok.ai"

pass=0
fail=0
declare -a results=()

check() {
  local label="$1" url="$2" expected_min="${3:-200}" expect_max="${4:-399}"
  local code
  code=$("$CURL" -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$url" 2>/dev/null || echo "000")
  if [[ "$code" -ge "$expected_min" && "$code" -le "$expect_max" ]]; then
    printf "  \033[32mPASS\033[0m  %-50s %s\n" "$label" "$code"
    results+=("PASS|$label|$code")
    ((pass++))
  else
    printf "  \033[31mFAIL\033[0m  %-50s %s (expected %s-%s)\n" "$label" "$code" "$expected_min" "$expect_max"
    results+=("FAIL|$label|$code")
    ((fail++))
  fi
}

echo "════════════════════════════════════════════════════════════════"
echo "  Council + CSOAI engine — live smoke harness"
echo "  $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "▸ CSOAI engine spine (meok-attestation-api)"
check "  /v1/health (SDK Pro gate)"  "$ATTEST_BASE/v1/health" 200 399
check "  /api/audit (hash-chained)"   "$ATTEST_BASE/api/audit"  200 399
check "  /pubkey (Ed25519)"          "$ATTEST_BASE/pubkey"     200 399
echo ""
echo "▸ Council surface (csoai.org — Vercel deploy status)"
for path in /council /council/dome /council/maps /council/compliance /council/law /council/sigil; do
  check "  ${path}" "$COUNCIL_BASE${path}" 200 399
done
echo ""
echo "▸ meok-api substrate (the data behind the council)"
for path in /health /api/council/status /api/expertise/network /api/bridges/topology /api/memory/status; do
  check "  meok-api:3200${path}" "$MEOK_API_LOCAL${path}" 200 399
done
echo ""
echo "▸ meok-api public mirror (api.meok.ai)"
check "  /health"                "$MEOK_API_PUBLIC/health"               200 399
check "  /api/council/status"    "$MEOK_API_PUBLIC/api/council/status"   200 399
echo ""
echo "════════════════════════════════════════════════════════════════"
printf "  Total: %d passed · %d failed\n" "$pass" "$fail"
echo "════════════════════════════════════════════════════════════════"

# Print one-line summary suitable for STATUS.md append
if [[ $fail -gt 0 ]]; then
  echo ""
  echo "Red surfaces (need attention):"
  for r in "${results[@]}"; do
    [[ "$r" == FAIL* ]] && echo "  $r"
  done
  exit 1
fi
exit 0
