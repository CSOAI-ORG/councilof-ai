#!/bin/bash
# Haulage DNS-Swap Helper
# One-command flip: detach domain from old Vercel project + attach to new one
#
# Usage:  ~/clawd/scripts/haulage-dns-swap.sh haulage.app haulage-app-umbrella
#         ~/clawd/scripts/haulage-dns-swap.sh muckaway.ai muckaway-saas
#         ~/clawd/scripts/haulage-dns-swap.sh grabhire.ai grabhire-ai-uk
#         ~/clawd/scripts/haulage-dns-swap.sh planthire.ai planthire-ai-uk

set -euo pipefail

DOMAIN="${1:?Usage: $0 <domain> <target-project-slug>}"
TARGET_PROJECT="${2:?Usage: $0 <domain> <target-project-slug>}"
SCOPE="niks-projects-0a2ef942"

echo "===Pre-flip status==="
echo "Domain: $DOMAIN"
echo "Target: $TARGET_PROJECT"
echo ""
echo "Current title at https://$DOMAIN:"
curl -s --max-time 5 "https://$DOMAIN" | grep -i -m1 -o "<title>[^<]*</title>"
echo ""

read -r -p "Confirm flip? (y/N) " CONFIRM
[[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]] && { echo "Aborted."; exit 0; }

echo ""
echo "===Step 1: Find current attached project==="
CURRENT=$(vercel domains inspect "$DOMAIN" --scope "$SCOPE" 2>/dev/null | grep -i "project" | head -1 || echo "(unknown)")
echo "Current attachment: $CURRENT"

echo ""
echo "===Step 2: Remove from old project==="
# Vercel CLI doesn't have a clean "detach" — easier to add to new (which fails if attached elsewhere, then we know)
# Try direct attach first; if it fails, fall back to manual instruction
vercel domains add "$DOMAIN" "$TARGET_PROJECT" --scope "$SCOPE" 2>&1 | tee /tmp/dns-swap.log || true

if grep -qi "already" /tmp/dns-swap.log; then
  echo ""
  echo "===Domain already attached to another project. Manual step required:==="
  echo "1. Open https://vercel.com/$SCOPE — find which project owns $DOMAIN"
  echo "2. In that project: Settings → Domains → Remove $DOMAIN"
  echo "3. Re-run: vercel domains add $DOMAIN $TARGET_PROJECT --scope $SCOPE"
  exit 1
fi

echo ""
echo "===Step 3: Verify (give DNS 30s)==="
sleep 30
NEW_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "https://$DOMAIN")
NEW_TITLE=$(curl -s --max-time 5 "https://$DOMAIN" | grep -i -m1 -o "<title>[^<]*</title>")
echo "HTTP $NEW_CODE"
echo "Title: $NEW_TITLE"

if [ "$NEW_CODE" = "200" ]; then
  echo ""
  echo "OK Flip complete. $DOMAIN now serves $TARGET_PROJECT."
  echo "Update topology: ~/clawd/_TOPOLOGY/HAULAGE_QUADRANT_2026-06-03.md"
else
  echo ""
  echo "WARN Flip returned non-200. Check Vercel dashboard."
fi
