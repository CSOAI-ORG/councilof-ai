#!/bin/bash
# W44 Day 2 — DEPLOY 5 PAGES TO VERCEL
# This is the REAL script that will actually deploy to Vercel.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Validate vercel CLI is installed
if ! command -v vercel >/dev/null 2>&1; then
    echo "ERROR: vercel CLI not installed"
    echo "Install: npm install -g vercel"
    exit 1
fi

# Validate VERCEL_TOKEN
if [ -z "$VERCEL_TOKEN" ]; then
    echo "ERROR: VERCEL_TOKEN must be set"
    echo "Get from https://vercel.com/account/tokens"
    exit 1
fi

# Check we're logged in
vercel whoami 2>&1 | head -3 || {
    echo "ERROR: not logged in to vercel. Run 'vercel login'"
    exit 1
}

echo "=== DEPLOYING 5 PAGES TO VERCEL ==="
echo ""

# Page definitions (REAL config from meek-defoneos-vercel-deploy-mcp)
declare -A PAGES=(
    ["meok-ai-defoneos"]="csoai-org/meok-ai"
    ["csoai-org-defoneos"]="csoai-org/csoai-org-v2"
    ["defoneos-com"]="csoai-org/defoneos-landing"
    ["meok-ai-sov-space"]="csoai-org/meok-ai-sov-space"
    ["csoai-org-knowledge-pack"]="csoai-org/csoai-org-knowledge-pack"
)

for page_name in "${!PAGES[@]}"; do
    repo="${PAGES[$page_name]}"
    echo "-> Deploying $page_name from $repo"
    cd "/Users/nicholas/$repo" || {
        echo "   SKIP: repo not found at $repo"
        continue
    }
    vercel --prod --yes --token="$VERCEL_TOKEN" 2>&1 | tail -5
    echo ""
done

echo "=== VERIFICATION ==="
sleep 30
curl -s -o /dev/null -w "meok.ai/defoneos: %{http_code}\n" https://meok.ai/defoneos
curl -s -o /dev/null -w "csoai.org/defoneos: %{http_code}\n" https://csoai.org/defoneos
curl -s -o /dev/null -w "defoneos.com: %{http_code}\n" https://defoneos.com/
curl -s -o /dev/null -w "meok.ai/sov-space: %{http_code}\n" https://meok.ai/sov-space
curl -s -o /dev/null -w "csoai.org/knowledge-pack: %{http_code}\n" https://csoai.org/knowledge-pack
