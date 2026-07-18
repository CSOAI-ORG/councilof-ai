#!/bin/bash
# pre_realias_check.sh — verify the NEW meok.ai Vercel deploy is safe to alias
# Run this when Vercel WAF clears (24-48h after ui-1s53t75fu was deployed)
#
# Usage:
#   ./pre_realias_check.sh <new-deploy-vercel-app-url>
#   ./pre_realias_check.sh https://meok-frontend-git-feat-xxx-nicholas.vercel.app
#
# Exit 0 = all required checks pass, safe to alias + POST IndexNow batch
# Exit 1 = at least one required check fails, do NOT alias (revenue would break)
#
# Known regressions (DO NOT block re-alias; tracked separately):
#   - /fleet returns 500 on source (CDN-cached 200 on www.meok.ai)
#     See _TABS/_inventory/FLEET_500_INVESTIGATION_2026-06-13.md
#     Likely cause: dynamic [...slug] lookup in app/fleet/page.tsx fails
#     Fix: ship a commit, redeploy, then re-run this check

set -e

NEW_URL="${1:?Usage: $0 <new-deploy-vercel-app-url>}"
INDEXNOW_KEY="4ce8d40dd91b87a343a68755bfb7e8c9"
INDEXNOW_BATCH="/Users/nicholas/clawd/meok.ai/indexnow_batch_real.json"

echo "=== Pre-re-alias check on $NEW_URL ==="
echo ""

pass=0
fail=0
warn=0

# REQUIRED check — fails the run
check_required() {
    local label="$1"
    local expected="$2"
    local url="$3"
    local body_match="$4"
    
    local code
    code=$(curl -s -o /tmp/_check_body -w "%{http_code}" -L --max-time 10 "$url" 2>/dev/null)
    local body
    body=$(cat /tmp/_check_body 2>/dev/null | head -c 200)
    
    if [ "$code" = "$expected" ]; then
        if [ -n "$body_match" ] && ! echo "$body" | grep -qi "$body_match"; then
            printf "  ✗ %-30s %s (body mismatch, expected '%s')\n" "$label" "$code" "$body_match"
            fail=$((fail + 1))
        else
            printf "  ✓ %-30s %s\n" "$label" "$code"
            pass=$((pass + 1))
        fi
    else
        printf "  ✗ %-30s %s (expected %s)\n" "$label" "$code" "$expected"
        fail=$((fail + 1))
    fi
}

# SOFT check — passes if 200, warns if not, doesn't fail
check_soft() {
    local label="$1"
    local url="$2"
    local body_match="$3"
    
    local code
    code=$(curl -s -o /tmp/_check_body -w "%{http_code}" -L --max-time 10 "$url" 2>/dev/null)
    local body
    body=$(cat /tmp/_check_body 2>/dev/null | head -c 200)
    
    if [ "$code" = "200" ]; then
        if [ -n "$body_match" ] && ! echo "$body" | grep -qi "$body_match"; then
            printf "  ⚠ %-30s %s (body mismatch, expected '%s')\n" "$label" "$code" "$body_match"
            warn=$((warn + 1))
        else
            printf "  ✓ %-30s %s\n" "$label" "$code"
            pass=$((pass + 1))
        fi
    else
        printf "  ⚠ %-30s %s (known regression, doesn't block)\n" "$label" "$code"
        warn=$((warn + 1))
    fi
}

echo "[REQUIRED] Revenue-critical pages:"
check_required "1a. /verify"        200 "$NEW_URL/verify"        "<"
check_required "1b. /enterprise"    200 "$NEW_URL/enterprise"    "<"
check_required "1c. /partner"       200 "$NEW_URL/partner"       "<"
check_required "1d. /reseller"      200 "$NEW_URL/reseller"      "<"

echo ""
echo "[REQUIRED] SEO / crawl surface:"
check_required "2a. /llms.txt"      200 "$NEW_URL/llms.txt"       "meok"
check_required "2b. /llms-full.txt" 200 "$NEW_URL/llms-full.txt"  "meok"
check_required "2c. /sitemap.xml"   200 "$NEW_URL/sitemap.xml"    "urlset"

echo ""
echo "[REQUIRED] API health (was 403 due to WAF, must be 200 now):"
check_required "3. /api/health"     200 "$NEW_URL/api/health"     "."

echo ""
echo "[REQUIRED] IndexNow key file (proves the new deploy serves the key):"
check_required "4. /.well-known/key" 200 "$NEW_URL/.well-known/${INDEXNOW_KEY}.txt" "$INDEXNOW_KEY"

echo ""
echo "[SOFT] Known regression — does NOT block re-alias:"
check_soft "5. /fleet"             "$NEW_URL/fleet"            "MEOK"

echo ""
echo "=== Result: $pass passed, $fail failed, $warn warned ==="
echo ""

if [ $fail -eq 0 ]; then
    echo "ALL REQUIRED CHECKS PASS — safe to alias + POST IndexNow."
    if [ $warn -gt 0 ]; then
        echo "  (soft warnings present — see /fleet known regression)"
    fi
    echo ""
    echo "If you have Vercel CLI auth (correct team context):"
    echo "  vercel alias set $NEW_URL meok.ai"
    echo "  vercel alias set $NEW_URL www.meok.ai"
    echo "  vercel alias set $NEW_URL try.meok.ai"
    echo "  curl -X POST https://api.indexnow.org/indexnow \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    --data @$INDEXNOW_BATCH"
    exit 0
else
    echo "FAIL — do NOT alias. Common causes:"
    echo "  - Vercel WAF still active (wait longer)"
    echo "  - Clerk env vars empty (Nick must set in Vercel dashboard)"
    echo "  - Build cache poisoning (Nick must clear and re-deploy)"
    exit 1
fi
