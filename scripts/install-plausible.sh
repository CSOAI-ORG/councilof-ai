#!/bin/bash
# install-plausible.sh — Add Plausible analytics snippet to all live domains
# Run: bash scripts/install-plausible.sh
# Authored: 2026-06-09 by Kimi orchestrator

set -e

# Plausible snippet (self-hosted or plausible.io)
# Using plausible.io free tier (up to 10k pageviews/mo)
PLAUSIBLE_SNIPPET='<script defer data-domain="DOMAIN" src="https://plausible.io/js/plausible.js"></script>'

DOMAINS=(
  "councilof.ai"
  "csoai.org"
  "proofof.ai"
  "safetyof.ai"
  "suicidestop.ai"
  "planthire.ai"
  "muckaway.ai"
  "haulage.app"
  "grabhire.ai"
  "templeman-opticians.com"
  "meok.ai"
)

echo "=== Plausible Analytics Install ==="
echo "Time: $(date)"
echo ""

for domain in "${DOMAINS[@]}"; do
  echo "--- $domain ---"
  # Note: This requires access to the site's HTML source
  # For static sites: add to index.html <head>
  # For Next.js: add to layout.tsx or _document.tsx
  # For Vercel-deployed: needs rebuild + redeploy
  echo "  Snippet: ${PLAUSIBLE_SNIPPET/DOMAIN/$domain}"
  echo "  Action: Add to <head> of $domain index page"
  echo ""
done

echo "=== Post-install verification ==="
for domain in "${DOMAINS[@]}"; do
  echo "curl -s https://$domain | grep -o 'plausible.io' | head -1"
done

echo ""
echo "Note: Plausible dashboard at https://plausible.io/$domain"
echo "Need to register each domain at plausible.io first (free tier)"
