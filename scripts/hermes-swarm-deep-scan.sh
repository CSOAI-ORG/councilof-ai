#!/bin/bash
# hermes-swarm-deep-scan.sh
# Every 12h — comprehensive swarm scan across ALL portfolio aspects
# Covers: bleeding edge research, open source, competitive intel, domain health,
# MCP/A2A/ACP gaps, SEO status, revenue metrics, codebase improvements
#
# Cron: 30 */12 * * * /Users/nicholas/clawd/scripts/hermes-swarm-deep-scan.sh

set -uo pipefail

LOG=~/.hermes/logs/swarm-deep-scan.log
REPORT=~/.hermes/logs/swarm-scan-$(date +%Y%m%d-%H%M).md
mkdir -p ~/.hermes/logs ~/.hermes/swarm-research

echo "" >> "$LOG"
echo "══════════════════════════════════════════════" >> "$LOG"
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] SWARM DEEP SCAN STARTING" >> "$LOG"

# ─────────────────────────────────────────────────────────────────
# HEADER
# ─────────────────────────────────────────────────────────────────
cat > "$REPORT" << 'REPORTHEAD'
# 🐝 Swarm Deep Scan Report
> Automated 12h scan — ALL portfolio aspects

REPORTHEAD
echo "**Generated:** $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$REPORT"
echo "**Cycle:** $(echo $(( $(date +%s) / 43200 )))" >> "$REPORT"
echo "" >> "$REPORT"

# ─────────────────────────────────────────────────────────────────
# 1. BLEEDING EDGE AI RESEARCH
# ─────────────────────────────────────────────────────────────────
echo "## 1. Bleeding Edge AI Research" >> "$REPORT"
echo "" >> "$REPORT"

# arXiv latest papers (last 24h) in AI, NLP, Multi-Agent, MCP
for topic in "cs.AI" "cs.CL" "cs.MA" "cs.SE"; do
  papers=$(curl -s "https://export.arxiv.org/api/query?search_query=cat:${topic}&start=0&max_results=5&sortBy=submittedDate&sortOrder=descending" 2>/dev/null | python3 -c "
import sys, xml.etree.ElementTree as ET
try:
    root = ET.fromstring(sys.stdin.read())
    ns = {'atom': 'http://www.w3.org/2005/Atom', 'arxiv': 'http://arxiv.org/schemas/atom'}
    for e in root.findall('atom:entry', ns)[:3]:
        title = e.find('atom:title', ns).text.strip()
        url = e.find('atom:id', ns).text
        print(f'  - [{title}]({url})')
except: pass
" 2>/dev/null)
  if [ -n "$papers" ]; then
    echo "### $topic" >> "$REPORT"
    echo "$papers" >> "$REPORT"
    echo "" >> "$REPORT"
  fi
done

# HuggingFace trending models (top 3)
echo "### HuggingFace Trending" >> "$REPORT"
curl -s "https://huggingface.co/api/models?sort=downloads&direction=-1&limit=5" 2>/dev/null | python3 -c "
import json, sys
try:
    models = json.load(sys.stdin)
    for m in models[:5]:
        print(f'  - **{m[\"id\"]}** — {m.get(\"downloads\",\"?\")} downloads | {m.get(\"likes\",\"?\")} likes')
except: print('  (unavailable)')
" >> "$REPORT" 2>/dev/null
echo "" >> "$REPORT"

# GitHub trending repos in AI/ML/MCP
echo "### GitHub Trending (AI/ML/MCP)" >> "$REPORT"
for query in "mcp+server+language:python" "ai+agent+language:typescript" "llm+framework+language:python"; do
  results=$(curl -s "https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=3" 2>/dev/null | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    for repo in data.get('items', [])[:3]:
        print(f'  - **{repo[\"full_name\"]}** ⭐{repo[\"stargazers_count\"]} — {repo.get(\"description\",\"\")[:120]}')
except: pass
" 2>/dev/null)
  if [ -n "$results" ]; then
    echo "$results" >> "$REPORT"
    echo "" >> "$REPORT"
  fi
done

# ─────────────────────────────────────────────────────────────────
# 2. OPEN SOURCE CODE ECOSYSTEM
# ─────────────────────────────────────────────────────────────────
echo "## 2. Open Source Ecosystem" >> "$REPORT"
echo "" >> "$REPORT"

# PyPI new releases in MCP/AI governance space
echo "### PyPI — Latest MCP/AI packages" >> "$REPORT"
curl -s "https://pypi.org/search/?q=mcp+ai+governance+compliance" 2>/dev/null | python3 -c "
import sys, re
text = sys.stdin.read()
pkgs = re.findall(r'/project/([^/\"]+)/', text)[:10]
for pkg in set(pkgs):
    print(f'  - {pkg}')
" >> "$REPORT" 2>/dev/null
echo "" >> "$REPORT"

# MEOK PyPI stats (from PyPI API)
echo "### MEOK OS PyPI Ecosystem" >> "$REPORT"
for pkg in eu-ai-act-compliance-mcp bias-detection-mcp dora-nis2-crosswalk-mcp agent-prompt-injection-firewall-mcp; do
  data=$(curl -s "https://pypi.org/pypi/${pkg}/json" 2>/dev/null | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    info = d.get('info', {})
    ver = info.get('version', '?')
    print(f'  - {pkg} v{ver}')
except: pass
" 2>/dev/null)
  echo "${data:-  - $pkg: (unavailable)}" >> "$REPORT"
done
echo "" >> "$REPORT"

# ─────────────────────────────────────────────────────────────────
# 3. .AI DOMAIN PORTFOLIO HEALTH
# ─────────────────────────────────────────────────────────────────
echo "## 3. .AI Domain Portfolio Health" >> "$REPORT"
echo "" >> "$REPORT"
echo "| Domain | HTTP | SSL | Vercel | Stripe |" >> "$REPORT"
echo "|--------|------|-----|--------|--------|" >> "$REPORT"

for domain in safetyof.ai councilof.ai agisafe.ai asisecurity.ai biasdetectionof.ai dataprivacyof.ai ethicalgovernanceof.ai transparencyof.ai accountabilityof.ai grabhire.ai planthire.ai muckaway.ai optimobile.ai commercialvehicle.ai meok.ai proofof.ai cobolbridge.ai fishkeeper.ai koikeeper.ai diyhelp.ai pokerhud.ai loopfactory.ai suicidestop.ai; do
  http_code=$(curl -s -o /dev/null -w "%{http_code}" -m 5 "https://${domain}" 2>/dev/null || echo "000")
  ssl_ok=$(curl -s -o /dev/null -w "%{ssl_verify_result}" -m 3 "https://${domain}" 2>/dev/null || echo "?")
  vercel_id=$(curl -s -I -m 3 "https://${domain}" 2>/dev/null | grep -i "x-vercel-id" | head -1 | sed 's/.*: //' | xargs || echo "-")
  echo "| $domain | $http_code | $ssl_ok | ${vercel_id:--} | - |" >> "$REPORT"
done
echo "" >> "$REPORT"

# ─────────────────────────────────────────────────────────────────
# 4. COMPETITIVE INTELLIGENCE
# ─────────────────────────────────────────────────────────────────
echo "## 4. Competitive Intelligence" >> "$REPORT"
echo "" >> "$REPORT"

echo "### MCP/AI Governance Competitors" >> "$REPORT"
for repo in "Ansvar-Systems/EU_compliance_MCP" "ark-forge/mcp-eu-ai-act" "arsialabs/arsia-protocol" "upstash/context7" "PrefectHQ/fastmcp" "contentauth/c2pa-mcp" "punkpeye/awesome-mcp-servers"; do
  data=$(curl -s "https://api.github.com/repos/$repo" 2>/dev/null | REPO_NAME="$repo" python3 -c "
import sys, json, os
repo = os.environ.get('REPO_NAME', 'unknown')
try:
    d = json.load(sys.stdin)
    stars = d.get('stargazers_count', '?')
    issues = d.get('open_issues_count', '?')
    pushed = d.get('pushed_at', '?')[:10]
    print(f'  - {repo} \u2b50{stars} | issues:{issues} | updated:{pushed}')
except Exception as e:
    print(f'  - {repo}: (unavailable)')
")
  echo "$data" >> "$REPORT"
done
echo "" >> "$REPORT"

# ─────────────────────────────────────────────────────────────────
# 5. MCP/A2A/ACP GAP ANALYSIS
# ─────────────────────────────────────────────────────────────────
echo "## 5. MCP/A2A/ACP Gap Analysis" >> "$REPORT"
echo "" >> "$REPORT"

# Count MEOK MCP servers vs marketplace
meok_mcps=$(cd ~/clawd/mcp-marketplace 2>/dev/null && ls -d */ 2>/dev/null | wc -l | tr -d ' ' || echo "?")
echo "- **MEOK MCP servers:** ${meok_mcps:-?}" >> "$REPORT"

# Missing MCP categories
echo "### Missing MCP Categories" >> "$REPORT"
for category in "healthcare-compliance" "construction-permitting" "fleet-telemetry" "agriculture-robotics" "mental-health-crisis" "aquaculture-monitoring" "financial-audit" "supply-chain-traceability"; do
  found=$(grep -rl "$category" ~/clawd/mcp-marketplace/ 2>/dev/null | wc -l | tr -d ' ')
  echo "  - $category: ${found} MCPs" >> "$REPORT"
done
echo "" >> "$REPORT"

# ─────────────────────────────────────────────────────────────────
# 6. LOCAL SERVICE HEALTH
# ─────────────────────────────────────────────────────────────────
echo "## 6. Local Service Health" >> "$REPORT"
echo "" >> "$REPORT"
echo '```' >> "$REPORT"
for svc in "3101:SOV3" "3200:MEOK_API" "3201:Ralph" "8644:Hermes" "18789:OpenClaw" "8888:Farm" "11434:Ollama" "3001:MEOK_UI"; do
  port="${svc%%:*}"
  name="${svc#*:}"
  status=$(curl -s -o /dev/null -w "%{http_code}" -m 2 "http://localhost:${port}/" 2>/dev/null || curl -s -o /dev/null -w "%{http_code}" -m 2 "http://localhost:${port}/health" 2>/dev/null || echo "000")
  echo "${name} (${port}): HTTP ${status}" >> "$REPORT"
done
echo '```' >> "$REPORT"
echo "" >> "$REPORT"

# ─────────────────────────────────────────────────────────────────
# 7. REVENUE METRICS
# ─────────────────────────────────────────────────────────────────
echo "## 7. Revenue Metrics" >> "$REPORT"
echo "" >> "$REPORT"

# Stripe event count (last 24h)
STRIPE_KEY="${STRIPE_SECRET_KEY:-${STRIPE_LIVE_KEY:-}}"
  if [ -z "$STRIPE_KEY" ]; then
    echo "  Stripe API: STRIPE_SECRET_KEY not set" >> "$REPORT"
  fi
yesterday=$(date -v-1d +%s 2>/dev/null || date -d "yesterday" +%s)
events=$(curl -s "https://api.stripe.com/v1/events?limit=5&created[gte]=${yesterday}" -u "${STRIPE_KEY}:" 2>/dev/null | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(f'  Events (24h): {len(data.get(\"data\", []))}')
    for e in data.get('data', [])[:5]:
        print(f'    - {e[\"type\"]} @ {e[\"created\"]}')
except: print('  Stripe API: unavailable')
")
echo "$events" >> "$REPORT"
echo "" >> "$REPORT"

# ─────────────────────────────────────────────────────────────────
# 8. SEO/BRAND HEALTH
# ─────────────────────────────────────────────────────────────────
echo "## 8. SEO & Brand Health" >> "$REPORT"
echo "" >> "$REPORT"
echo "### Index Status" >> "$REPORT"
for domain in meok.ai safetyof.ai councilof.ai; do
  sitemap_code=$(curl -s -o /dev/null -w "%{http_code}" -m 5 "https://${domain}/sitemap.xml" 2>/dev/null || echo "000")
  robots_code=$(curl -s -o /dev/null -w "%{http_code}" -m 5 "https://${domain}/robots.txt" 2>/dev/null || echo "000")
  echo "  - $domain — sitemap: $sitemap_code | robots: $robots_code" >> "$REPORT"
done
echo "" >> "$REPORT"

# ─────────────────────────────────────────────────────────────────
# 9. CODEBASE IMPROVEMENT OPPORTUNITIES
# ─────────────────────────────────────────────────────────────────
echo "## 9. Codebase Improvement Opportunities" >> "$REPORT"
echo "" >> "$REPORT"

# Check for TypeScript errors across portfolio
echo "### Build Status Quick Check" >> "$REPORT"
for proj in meok-ai-frontend safetyofai industrial-hire-ai councilof-ai diyhelp.ai pokerhud.ai fishkeeper-ai koikeeper-ai loopfactory.ai suicidestop.ai; do
  dir="/Users/nicholas/$proj"
  if [ -d "$dir/.next" ]; then
    build_age=$(python3 -c "import os,time; print(int((time.time()-os.path.getmtime('$dir/.next/BUILD_ID'))/3600)) if os.path.exists('$dir/.next/BUILD_ID') else print('N/A')" 2>/dev/null || echo "?")
    echo "  - $proj: built ${build_age}h ago" >> "$REPORT"
  else
    echo "  - $proj: not built" >> "$REPORT"
  fi
done
echo "" >> "$REPORT"

# Check for missing vercel.json
echo "### Missing Vercel Config" >> "$REPORT"
for proj in meok-ai-frontend safetyofai industrial-hire-ai councilof-ai diyhelp.ai pokerhud.ai fishkeeper-ai koikeeper-ai loopfactory.ai suicidestop.ai; do
  dir="/Users/nicholas/$proj"
  if [ -d "$dir" ] && [ ! -f "$dir/vercel.json" ]; then
    echo "  - ⚠️ $proj: no vercel.json" >> "$REPORT"
  fi
done
echo "" >> "$REPORT"

# ─────────────────────────────────────────────────────────────────
# 10. RESEARCH QUEUE UPDATE
# ─────────────────────────────────────────────────────────────────
echo "## 10. Research Queue Status" >> "$REPORT"
echo "" >> "$REPORT"
QUEUE=~/clawd/revenue/RESEARCH_QUEUE.md
if [ -f "$QUEUE" ]; then
  total=$(grep -c "^###" "$QUEUE" 2>/dev/null || echo "0")
  answered=$(grep -c "✅" "$QUEUE" 2>/dev/null || echo "0")
  echo "- Total questions: $total" >> "$REPORT"
  echo "- Answered: $answered" >> "$REPORT"
  echo "- Remaining: $((total - answered))" >> "$REPORT"
  
  echo "### Next 3 Unanswered" >> "$REPORT"
  grep -A1 "^### " "$QUEUE" 2>/dev/null | grep -v "✅" | head -6 >> "$REPORT" 2>/dev/null
else
  echo "(no research queue found)" >> "$REPORT"
fi
echo "" >> "$REPORT"

# ─────────────────────────────────────────────────────────────────
# FOOTER
# ─────────────────────────────────────────────────────────────────
cat >> "$REPORT" << 'REPORTFOOT'

---
**Scan complete.** Next scan in ~12h.
🐝 Swarm continues.
REPORTFOOT

# ─────────────────────────────────────────────────────────────────
# SUBMIT TO SOV3 FOR COUNCIL AUDIT
# ─────────────────────────────────────────────────────────────────
echo "" >> "$LOG"
echo "[$(date -u +%H:%M:%SZ)] Scan complete: $REPORT" >> "$LOG"

# If SOV3 is up, submit findings
if curl -s -m 2 -o /dev/null http://localhost:3101/health 2>/dev/null; then
  python3 -c "
import json, urllib.request
data = {
  'summary': 'Swarm deep scan completed',
  'report_path': '$REPORT',
  'timestamp': '$(date -u +%Y-%m-%dT%H:%M:%SZ)'
}
try:
    req = urllib.request.Request('http://localhost:3101/mcp/coord_submit_task',
        data=json.dumps(data).encode(),
        headers={'Content-Type': 'application/json'})
    urllib.request.urlopen(req, timeout=5)
except: pass
" 2>/dev/null
  echo "[$(date -u +%H:%M:%SZ)] Submitted to SOV3 council" >> "$LOG"
fi

echo "══════════════════════════════════════════════" >> "$LOG"
exit 0
