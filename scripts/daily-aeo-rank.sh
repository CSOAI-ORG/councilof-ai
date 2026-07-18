#!/bin/bash
# Daily AEO (Answer Engine Optimization) rank check
# Logs whether MEOK appears in AI search for governance queries
# Cron: 0 7 * * *

set -e
LOG=~/.hermes/logs/aeo-rank.log
mkdir -p ~/.hermes/logs

echo "===== $(date -u +%Y-%m-%dT%H:%M:%SZ) — AEO Rank Check =====" >> "$LOG"

# Self-search: does meok.ai appear in standard search?
for query in "eu+ai+act+mcp" "ai+governance+mcp" "dora+nis2+crosswalk" "ai+compliance+mcp"; do
  google_hits=$(curl -s "https://www.google.com/search?q=site:meok.ai+$query" -A "Mozilla/5.0" 2>/dev/null | grep -oE 'About [0-9,]+ result' | head -1 || echo "no data")
  echo "  Query [$query]: google site:meok.ai = $google_hits" >> "$LOG"
done

# Indexing status
sitemap_urls=$(curl -s https://www.meok.ai/sitemap.xml | grep -c "<loc>")
echo "  Sitemap URLs: $sitemap_urls" >> "$LOG"

# Council site sitemap
council_sm=$(curl -sL -o /dev/null -w "%{http_code}" https://councilof.ai/sitemap.xml)
echo "  Councilof.ai sitemap: HTTP $council_sm" >> "$LOG"

# robots.txt AEO check
gpt_allow=$(curl -s https://www.meok.ai/robots.txt | grep -A1 "GPTBot" | grep -c "Allow")
claude_allow=$(curl -s https://www.meok.ai/robots.txt | grep -A1 "ClaudeBot" | grep -c "Allow")
echo "  GPTBot allowed: $gpt_allow | ClaudeBot allowed: $claude_allow" >> "$LOG"

echo "" >> "$LOG"
