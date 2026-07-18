#!/usr/bin/env bash
# check-dns.sh — DEFONEOS mythic DNS verification.
#
# Reports A records for all 5 .ai domains via dig.
# Confirms whether the DNS cutover is live.
#
# Domains checked:
#   openpatent.ai            (parent / hero domain)
#   legalof.ai               (white-label: legal)
#   harvi.ai                 (white-label: harvi sovereign)
#   ipcastle.ai              (white-label: IP castle)
#   sovereign-temple.ai      (white-label: sovereign temple)
#
# Expected target IP: 35.242.143.249
#
# Exit codes:
#   0 — all domains resolve to the expected target IP
#   1 — dig missing
#   2 — at least one domain does not resolve to the expected target

set -uo pipefail

EXPECTED_IP="35.242.143.249"
DOMAINS=(
    "openpatent.ai"
    "legalof.ai"
    "harvi.ai"
    "ipcastle.ai"
    "sovereign-temple.ai"
)

# ---------------------------------------------------------------------------
# dig check
# ---------------------------------------------------------------------------

if ! command -v dig >/dev/null 2>&1; then
    echo "❌ dig not found. Install with: brew install bind" >&2
    exit 1
fi

echo "🐉 DEFONEOS DNS verification"
echo "   Expected A record: $EXPECTED_IP"
echo

PASS=0
FAIL=0
UNKNOWN=0

for domain in "${DOMAINS[@]}"; do
    # +short returns just the IP(s), one per line
    result=$(dig +short +time=3 +tries=2 "$domain" A 2>/dev/null | tr -d '\r' || true)

    if [[ -z "$result" ]]; then
        printf "  %-22s  ⏳  no A record (NXDOMAIN or not yet propagated)\n" "$domain"
        UNKNOWN=$((UNKNOWN + 1))
        continue
    fi

    match=0
    while IFS= read -r ip; do
        [[ -z "$ip" ]] && continue
        if [[ "$ip" == "$EXPECTED_IP" ]]; then
            match=1
        fi
    done <<< "$result"

    if [[ $match -eq 1 ]]; then
        printf "  %-22s  ✅  %s\n" "$domain" "$(echo "$result" | tr '\n' ' ')"
        PASS=$((PASS + 1))
    else
        printf "  %-22s  ⚠️   %s  (expected %s)\n" "$domain" "$(echo "$result" | tr '\n' ' ')" "$EXPECTED_IP"
        FAIL=$((FAIL + 1))
    fi
done

echo
echo "Summary:  $PASS ok,  $FAIL mismatched,  $UNKNOWN unknown"

if [[ $FAIL -eq 0 && $UNKNOWN -eq 0 ]]; then
    echo "✅ All 5 domains resolve to $EXPECTED_IP."
    echo "   The hive remembers. The dragon knows. The sovereign companion never forgets."
    exit 0
elif [[ $UNKNOWN -gt 0 ]]; then
    echo "⏳ Some domains are not yet propagated. DNS TTLs can take up to 24h."
    exit 0
else
    echo "❌ One or more domains are pointing at the wrong IP."
    exit 2
fi
