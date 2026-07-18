#!/bin/bash
# Daily competitive intelligence scan
# Tracks Ansvar, ArkForge, ARSIA, and other governance MCP competitors
# Logs to ~/.hermes/logs/competitive-scan.log
# Cron: 0 7 * * *

set -e
LOG=~/.hermes/logs/competitive-scan.log
mkdir -p ~/.hermes/logs

echo "===== $(date -u +%Y-%m-%dT%H:%M:%SZ) — Daily Competitive Scan =====" >> "$LOG"

# Track competitor GitHub stats
for repo in "Ansvar-Systems/EU_compliance_MCP" "ark-forge/mcp-eu-ai-act" "arsialabs/arsia-protocol" "upstash/context7" "PrefectHQ/fastmcp" "contentauth/c2pa-mcp"; do
  data=$(curl -s "https://api.github.com/repos/$repo" 2>/dev/null | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(f\"{d.get('stargazers_count','?')} stars | {d.get('open_issues_count','?')} issues | updated {d.get('pushed_at','?')[:10]}\")
except: print('FETCH_ERR')
")
  echo "  $repo: $data" >> "$LOG"
done

# Track MEOK position in awesome lists
for list_repo in "punkpeye/awesome-mcp-servers" "wong2/awesome-mcp-servers" "appcypher/awesome-mcp-servers"; do
  has_meok=$(curl -s "https://raw.githubusercontent.com/$list_repo/main/README.md" 2>/dev/null | grep -c "meok\|councilof\|eu-ai-act")
  echo "  $list_repo: MEOK refs = $has_meok" >> "$LOG"
done

echo "" >> "$LOG"
