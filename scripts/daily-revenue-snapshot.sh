#!/bin/bash
# Daily PyPI downloads + revenue snapshot
# Tracks growth/decline across all 15 top MCPs
# Cron: 0 7 * * *

set -e
LOG=~/.hermes/logs/revenue-snapshot.log
PYPISTATS=~/Library/Python/3.9/bin/pypistats
mkdir -p ~/.hermes/logs

echo "===== $(date -u +%Y-%m-%dT%H:%M:%SZ) — Revenue Snapshot =====" >> "$LOG"

# Top 15 download tracking
total_day=0
total_week=0
total_month=0
for pkg in eu-ai-act-compliance-mcp bias-detection-mcp ai-bom-mcp dora-compliance-mcp nis2-compliance-mcp cra-compliance-mcp ai-incident-reporting-mcp dora-nis2-crosswalk-mcp agent-prompt-injection-firewall-mcp agent-handoff-certified-mcp agent-policy-enforcement-mcp agent-audit-logger-mcp uk-ai-bill-compliance-mcp agent-rate-limiter-mcp watermarking-authenticity-mcp; do
  data=$($PYPISTATS recent "$pkg" --json 2>/dev/null | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin).get('data', {})
    print(f\"{d.get('last_day',0)},{d.get('last_week',0)},{d.get('last_month',0)}\")
except: print('0,0,0')
")
  day=$(echo "$data" | cut -d, -f1)
  week=$(echo "$data" | cut -d, -f2)
  month=$(echo "$data" | cut -d, -f3)
  total_day=$((total_day + day))
  total_week=$((total_week + week))
  total_month=$((total_month + month))
  echo "  $pkg: day=$day week=$week month=$month" >> "$LOG"
done

echo "  TOTALS: day=$total_day week=$total_week month=$total_month" >> "$LOG"

# Estimate real humans (20% of total)
real=$((total_month * 20 / 100))
echo "  Est. real humans: $real" >> "$LOG"

# Attestation API health
api_status=$(curl -sL -o /dev/null -w "%{http_code}" https://meok-attestation-api.vercel.app/)
echo "  Attestation API: HTTP $api_status" >> "$LOG"

echo "" >> "$LOG"
