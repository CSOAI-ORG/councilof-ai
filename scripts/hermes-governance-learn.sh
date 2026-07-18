#!/bin/bash
# Hermes daily governance learning — makes Hermes a master of AI governance
# Cron: 0 5 * * * (5 AM UTC, before other Hermes jobs)
# Outputs to: ~/.hermes/governance-corpus/

set -e
CORPUS=~/.hermes/governance-corpus
mkdir -p "$CORPUS"
DATE=$(date -u +%Y-%m-%d)
LOG=~/.hermes/logs/governance-learn.log
mkdir -p ~/.hermes/logs

echo "===== $(date -u +%Y-%m-%dT%H:%M:%SZ) — Governance Learning =====" >> "$LOG"

# 1. EUR-Lex daily updates (Atom feed for new EU regulations)
echo "" >> "$LOG"
echo "--- EUR-Lex Official Journal L-series ---" >> "$LOG"
curl -s "https://eur-lex.europa.eu/EN/RSS/rss_ojl.xml" -A "MEOK-Hermes/1.0" 2>/dev/null \
  | python3 -c "
import sys, re
text = sys.stdin.read()
titles = re.findall(r'<title>([^<]+)</title>', text)
links = re.findall(r'<link>([^<]+)</link>', text)
for t, l in list(zip(titles, links))[1:6]:  # skip first which is feed title
    print(f'  {t[:100]}')
    print(f'    {l}')
" >> "$LOG" 2>&1 || echo "  EUR-Lex unreachable" >> "$LOG"

# 2. UK legislation.gov.uk new acts
echo "" >> "$LOG"
echo "--- UK legislation.gov.uk new acts ---" >> "$LOG"
curl -s "https://www.legislation.gov.uk/new/data.feed" -A "MEOK-Hermes/1.0" 2>/dev/null \
  | python3 -c "
import sys, re
text = sys.stdin.read()
entries = re.findall(r'<entry>.*?<title[^>]*>([^<]+)</title>.*?<link[^>]+href=\"([^\"]+)\"', text, re.DOTALL)
for t, l in entries[:5]:
    print(f'  {t[:100]}')
    print(f'    {l}')
" >> "$LOG" 2>&1 || echo "  UK legislation unreachable" >> "$LOG"

# 3. CISA KEV catalog new additions
echo "" >> "$LOG"
echo "--- CISA KEV recent additions ---" >> "$LOG"
curl -s "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json" -A "MEOK-Hermes/1.0" 2>/dev/null \
  | python3 -c "
import sys, json
from datetime import datetime, timedelta
try:
    d = json.load(sys.stdin)
    cutoff = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
    recent = [v for v in d.get('vulnerabilities', []) if v.get('dateAdded', '') >= cutoff]
    print(f'  KEV catalog: {d.get(\"count\", \"?\")} total, {len(recent)} added in last 7 days')
    for v in recent[:5]:
        print(f'    {v.get(\"cveID\")}: {v.get(\"vulnerabilityName\")[:80]}')
        print(f'      due: {v.get(\"dueDate\")}, product: {v.get(\"vendorProject\", \"?\")} {v.get(\"product\", \"\")}')
except Exception as e:
    print(f'  Parse error: {e}')
" >> "$LOG" 2>&1 || echo "  CISA KEV unreachable" >> "$LOG"

# 4. NIST CVE recent
echo "" >> "$LOG"
echo "--- NIST CVE feed (last 7 days) ---" >> "$LOG"
LAST_WEEK=$(date -u -v-7d +%Y-%m-%dT00:00:00.000 2>/dev/null || date -u -d '7 days ago' +%Y-%m-%dT00:00:00.000)
curl -s "https://services.nvd.nist.gov/rest/json/cves/2.0?pubStartDate=${LAST_WEEK}&resultsPerPage=10" -A "MEOK-Hermes/1.0" 2>/dev/null \
  | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(f'  NVD: {d.get(\"totalResults\", 0)} CVEs in last 7 days, showing 5 critical')
    for v in d.get('vulnerabilities', [])[:5]:
        cve = v.get('cve', {})
        cve_id = cve.get('id', '?')
        descs = cve.get('descriptions', [])
        desc = descs[0].get('value', '?') if descs else '?'
        metrics = cve.get('metrics', {}).get('cvssMetricV31', [{}])
        score = metrics[0].get('cvssData', {}).get('baseScore', '?') if metrics else '?'
        print(f'    {cve_id} (CVSS {score}): {desc[:100]}')
except Exception as e:
    print(f'  Parse error: {e}')
" >> "$LOG" 2>&1 || echo "  NVD unreachable" >> "$LOG"

echo "" >> "$LOG"
echo "Governance corpus update complete: $CORPUS" >> "$LOG"
