#!/bin/bash
# DEFONEOS EAT MODE — FULL DAY AUTOMATION
# Runs every 2 hours, does real work, logs to /tmp/defoneos-eat.log
# Starts: 10 Jul 2026 05:36 BST

LOG="/tmp/defoneos-eat.log"
PAGES_DIR="/Users/nicholas/clawd/csoai-static-deploy2"
MEOK_DIR="/Users/nicholas/clawd/meok-deploy"

echo "$(date '+%H:%M') ===🐉 EAT CYCLE START===" >> "$LOG"

# 1. Check Vercel
vercel_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "https://csoai-static-deploy2.vercel.app/" 2>/dev/null)
echo "$(date '+%H:%M') Vercel: $vercel_code" >> "$LOG"

# 2. Check VM
vm_status=$(ssh -o ConnectTimeout=5 meok-backend "uptime" 2>&1 | head -1)
if echo "$vm_status" | grep -q "up"; then
  echo "$(date '+%H:%M') ✅ VM: ALIVE" >> "$LOG"
  # Check SOV3
  sov3_tools=$(curl -s --max-time 5 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' 2>/dev/null | python3 -c "import json,sys;d=json.load(sys.stdin);print(len(d.get('result',{}).get('tools',[])))" 2>/dev/null)
  echo "$(date '+%H:%M') ✅ SOV3: $sov3_tools tools" >> "$LOG"
else
  echo "$(date '+%H:%M') 🔴 VM: OFFLINE — needs GCP Console restart" >> "$LOG"
fi

# 3. Check MEOK OS
meok_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:3000 2>/dev/null)
echo "$(date '+%H:%M') MEOK OS :3000: $meok_code" >> "$LOG"

# 4. Deploy any undeployed pages
cd "$PAGES_DIR"
page_count=$(ls *.html 2>/dev/null | wc -l | tr -d ' ')
echo "$(date '+%H:%M') Pages: $page_count" >> "$LOG"

# 5. Check for new pages since last deploy
if [ -f /tmp/defoneos-last-deploy-count ]; then
  last_count=$(cat /tmp/defoneos-last-deploy-count)
  if [ "$page_count" -gt "$last_count" ]; then
    echo "$(date '+%H:%M') New pages detected ($last_count → $page_count). Deploying..." >> "$LOG"
    vercel --prod --yes 2>&1 | tail -1 >> "$LOG"
    echo "$page_count" > /tmp/defoneos-last-deploy-count
  fi
else
  echo "$page_count" > /tmp/defoneos-last-deploy-count
fi

# 6. Update sitemap
echo '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' > sitemap.xml
for f in *.html; do echo "  <url><loc>https://csoai-static-deploy2.vercel.app/${f}</loc><lastmod>2026-07-10</lastmod><changefreq>weekly</changefreq></url>" >> sitemap.xml; done
echo '</urlset>' >> sitemap.xml

# 7. Check for broken links (quick scan)
broken=$(python3 -c "
import os, re
all_files = set(f for f in os.listdir('.') if f.endswith('.html'))
broken = 0
for f in all_files:
    with open(f) as fh:
        links = re.findall(r'href=\"([a-z0-9_.-]+\.html)\"', fh.read())
    for link in links:
        if link not in all_files:
            broken += 1
print(broken)
" 2>/dev/null)
echo "$(date '+%H:%M') Broken links: $broken" >> "$LOG"

# 8. SIGIL heartbeat (if SOV3 is up)
if [ -n "$sov3_tools" ]; then
  curl -s --max-time 5 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"sigil_emit\",\"arguments\":{\"line\":\"C|eat-mode|HEARTBEAT|EAT cycle $(date '+%H:%M'). Pages: $page_count. VM: $vm_status. Broken: $broken. Dragon eating.\"}}}" 2>/dev/null | python3 -c "import json,sys;d=json.load(sys.stdin);print(d.get('result',{}).get('content',[{}])[0].get('text','')[:50])" 2>/dev/null >> "$LOG"
fi

echo "$(date '+%H:%M') ===EAT CYCLE END===" >> "$LOG"
echo "---" >> "$LOG"
