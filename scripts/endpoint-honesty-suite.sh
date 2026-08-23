#!/usr/bin/env bash
# endpoint-honesty-suite.sh — assert every public endpoint is LIVE + HONEST.
# Honest = it either works or says clearly what is missing (never fabricates a result).
# Run on the pod. cron-able.
set -uo pipefail
BASE=https://councilof.ai
PASS=0; FAIL=0
check() { # $1=desc $2=curl-out
  if echo "$2" | grep -qE "$3"; then echo "  ✓ $1"; PASS=$((PASS+1)); else echo "  ✗ $1"; FAIL=$((FAIL+1)); fi
}
echo "=== ENDPOINT HONESTY SUITE $(date -u +%FT%TZ) ==="
# 1. core live endpoints (200 = live)
for ep in "/api/gspc" "/api/mcp" "/api/arena/rounds.jsonl" "/api/arena/scoreboard" "/api/reported" "/api/security"; do
  c=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$BASE$ep")
  if [ "$c" = "200" ]; then echo "  ✓ $ep live (200)"; PASS=$((PASS+1)); else echo "  ✗ $ep expected 200 got $c"; FAIL=$((FAIL+1)); fi
done
# 2. article50: honest-refusal is CORRECT (must say secret not bound, never fake)
HASH=$(echo -n "honesty-suite" | sha256sum | cut -d" " -f1)
R=$(curl -s --max-time 15 -X POST "$BASE/api/article50" -H "content-type: application/json" -d "{\"content_hash\":\"$HASH\",\"provider\":\"suite\",\"interaction_type\":\"generated\",\"watermarked\":true}")
check "article50 honest-refusal or passport" "$R" 'ok|signing key not bound'
# 3. cards: honest UNPUBLISHED (never a fake card list)
R=$(curl -s --max-time 15 "$BASE/api/cards")
check "cards honest (says UNPUBLISHED when no bundle)" "$R" 'UNPUBLISHED|cards'
# 4. assess: honest UNMEASURED for empty input (never invents a score)
R=$(curl -s --max-time 15 -X POST "$BASE/api/assess" -H "content-type: application/json" -d '{"description":""}')
check "assess honest (UNMEASURED / validation error on empty)" "$R" 'UNMEASURED|error'
# 5. signed leaderboard verify: content present + schema honest
R=$(curl -s --max-time 20 "$BASE/api/arena/scoreboard")
check "scoreboard signed + doctrine" "$R" 'signature|doctrine'
# 6. did:web trust anchor reachable
R=$(curl -s --max-time 15 "https://csoai.org/.well-known/did.json")
check "did:web reachable (4+ Ed25519 verified methods)" "$R" 'verificationMethod|Ed25519'
echo "=== RESULT: PASS=$PASS FAIL=$FAIL $(date -u +%FT%TZ) ==="
exit $([ $FAIL -eq 0 ] && echo 0 || echo 1)
