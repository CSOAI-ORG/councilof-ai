#!/bin/bash
# IndexNow ping — one POST propagates to Bing/Yandex/Naver/Seznam/Yep.
# Key file must be live at https://csoai.org/{KEY}.txt (and councilof.ai via redirect).
# Usage: scripts/indexnow-ping.sh [url1 url2 ...]  (default: top 20 sitemap URLs)
set -euo pipefail
KEY="0b98cc9d862ee53c5e5c58ceb2c62d78afdc1ed188c89df1317256d193b510c5"
HOST="https://csoai.org"
if [ $# -gt 0 ]; then
  URLS=("$@")
else
  URLS=($(grep -oE "<loc>[^<]+" public/sitemap.xml 2>/dev/null | sed 's/<loc>//' | head -20))
fi
BODY=$(python3 -c "
import json, sys
urls = sys.argv[1:]
print(json.dumps({'host': 'csoai.org', 'key': '$KEY', 'keyLocation': '$HOST/$KEY.txt', 'urlList': urls}))
" "${URLS[@]}")
echo "  pinging ${#URLS[@]} URLs to api.indexnow.org"
curl -s -X POST "https://api.indexnow.org/indexnow" -H "Content-Type: application/json; charset=utf-8" -d "$BODY" -o /tmp/indexnow-resp.txt -w "  HTTP %{http_code}\n"
cat /tmp/indexnow-resp.txt | head -2
