#!/usr/bin/env bash
# IndexNow submission for Bing/Yandex indexing
# Usage: bash scripts/monitoring/indexnow-submit.sh
# Note: Key file (public/<key>.txt) must be deployed first.
set -euo pipefail

KEY="97a1aa3163534fae954108d8941eb361"
HOST="councilof.ai"
KEY_URL="https://councilof.ai/${KEY}.txt"

URLS=(
  "https://councilof.ai/"
  "https://councilof.ai/api/gspc"
  "https://councilof.ai/llms.txt"
  "https://councilof.ai/feed.xml"
  "https://councilof.ai/sitemap.xml"
  "https://councilof.ai/gspc-verify"
  "https://councilof.ai/root.json"
)

echo "Submitting ${#URLS[@]} URLs to IndexNow..."
echo "Key: $KEY"
echo "Host: $HOST"
echo ""

# Submit to Bing IndexNow
URL_LIST=$(printf '"%s",' "${URLS[@]}" | sed 's/,$//')
curl -s -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json" \
  -d "{
    \"host\": \"$HOST\",
    \"key\": \"$KEY\",
    \"keyLocation\": \"$KEY_URL\",
    \"urlList\": [$URL_LIST]
  }" && echo "" && echo "✅ Submitted to IndexNow (Bing)"

# Also submit to Yandex
curl -s -X POST "https://yandex.com/indexnow" \
  -H "Content-Type: application/json" \
  -d "{
    \"host\": \"$HOST\",
    \"key\": \"$KEY\",
    \"keyLocation\": \"$KEY_URL\",
    \"urlList\": [$URL_LIST]
  }" && echo "" && echo "✅ Submitted to IndexNow (Yandex)"
