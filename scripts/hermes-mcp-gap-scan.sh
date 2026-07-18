#!/bin/bash
# Hermes daily PyPI gap scanner — finds governance MCP gaps
# Cron: 0 5 * * 1 (Mondays 5 AM UTC)
# Looks for governance topics on PyPI that MEOK does NOT yet cover

set -e
LOG=~/.hermes/logs/mcp-gap-scan.log
mkdir -p ~/.hermes/logs

echo "===== $(date -u +%Y-%m-%dT%H:%M:%SZ) — MCP Gap Scan =====" >> "$LOG"

# Topics MEOK should monitor for coverage gaps
TOPICS=("eu-ai-act" "dora" "nis2" "cra" "csrd" "gdpr" "iso-42001" "hipaa" "fda-samd" "mdr" "mica" "basel" "mifid" "aml-cft" "coppa" "ferpa" "ferc" "fips" "soc-2" "iso-27001" "owasp" "mitre-attack" "mitre-atlas" "cisa-kev" "sbom" "slsa" "sigstore")

for topic in "${TOPICS[@]}"; do
  # Search PyPI for packages with this topic
  count=$(curl -s "https://pypi.org/search/?q=$topic&format=json" 2>/dev/null | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('count', 0))
except:
    print('?')
" 2>/dev/null)

  # Check if MEOK has a matching MCP
  meok_match=$(ls /Users/nicholas/clawd/mcp-marketplace/ 2>/dev/null | grep -i "${topic}" | head -1)

  if [ -n "$meok_match" ]; then
    echo "  [✓ COVERED] $topic — MEOK: $meok_match" >> "$LOG"
  else
    echo "  [⚠ GAP] $topic — no MEOK MCP" >> "$LOG"
  fi
done

# Find trending MCP packages on PyPI in last 7 days
echo "" >> "$LOG"
echo "--- Trending MCP packages on PyPI ---" >> "$LOG"
curl -s "https://pypi.org/search/?q=mcp+server" -A "MEOK-Hermes/1.0" 2>/dev/null \
  | python3 -c "
import sys, re
text = sys.stdin.read()
# Extract package names from search HTML
pkgs = re.findall(r'package-snippet__name[^>]*>([^<]+)<', text)
for p in pkgs[:10]:
    print(f'  {p}')
" >> "$LOG" 2>&1

echo "" >> "$LOG"
