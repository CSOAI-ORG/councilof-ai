#!/usr/bin/env bash
# Full prerender + deploy to the councilof-ai Pages project (the one councilof.ai points to).
set -euo pipefail
export PATH="/opt/homebrew/opt/node/bin:/Users/nicholas/.local/node/bin:/opt/homebrew/bin:$PATH"
export CLOUDFLARE_ACCOUNT_ID="52092e4dad74b51759a2f748c8cf2528"
export CLOUDFLARE_API_TOKEN="$(security find-generic-password -s meok-keystone -a CLOUDFLARE_API_TOKEN -w 2>/dev/null)"
cd /Users/nicholas/councilof-ai-wt
echo "node: $(node -v)  npm: $(npm -v)  wrangler: $(npx wrangler --version 2>/dev/null | head -1)"

echo "[1/6] npm install"
npm install --no-audit --no-fund 2>&1 | tail -3

echo "[2/6] install chromium for prerender"
npx playwright install chromium 2>&1 | tail -2

echo "[3/6] build:client"
npm run build:client 2>&1 | tail -6

echo "[4/6] copy corrected field pages into dist"
rm -f dist/client/gspc-scoreboard.html
node scripts/place-end-user-aliases.mjs dist/client 2>&1 | tail -2 || true
for b in carebench conductbench defbench detbench mcpbench machbench ossbench pqcbench provbench swarmbench xrbench arena govbench agibench paper-district; do
  if [ -f "client/public/$b.html" ]; then
    cp "client/public/$b.html" "dist/client/$b.html"
    mkdir -p "dist/client/$b"
    cp "client/public/$b.html" "dist/client/$b/index.html"
    echo "  placed $b"
  fi
done

echo "[5/6] prerender all routes"
node scripts/prerender.mjs --dist dist/client --wait 900 --min 350 2>&1 | tail -8

echo "[6/6] deploy to councilof-ai (main = prod alias)"
npx wrangler pages deploy dist/client --project-name=councilof-ai --branch=main --commit-dirty=true 2>&1 | tail -8

echo "=== verify on councilof.ai ==="
sleep 25
for p in "" fleet-sweep gspc-verify about contact eu-ai-act; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -m 12 "https://councilof.ai$([ -z "$p" ] && echo '/' || echo "/$p")" 2>/dev/null)
  size=$(curl -s -o /dev/null -w "%{size_download}" -m 12 "https://councilof.ai$([ -z "$p" ] && echo '/' || echo "/$p")" 2>/dev/null)
  echo "  /$p -> $code ($size bytes)"
done
echo "DONE-RECLAIM"
