#!/usr/bin/env bash
# TUI-6 Distribution Monitoring Snapshot
# Collects real data from live endpoints and writes a dated JSON report.
# Usage: bash scripts/monitoring/tui6-snapshot.sh
set -euo pipefail

OUT_DIR="docs/tui6/snapshots"
mkdir -p "$OUT_DIR"
DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)
OUT="$OUT_DIR/snapshot-$(date -u +%Y%m%d-%H%M%S).json"

echo "Collecting TUI-6 snapshot at $DATE..."

# 1. Revenue
echo "  Revenue..."
REVENUE=$(curl -sf https://councilof.ai/api/revenue 2>/dev/null || echo '{}')

# 2. Receipts
echo "  Receipts..."
RECEIPTS=$(curl -sf https://councilof.ai/api/receipts/latest 2>/dev/null || echo '{}')

# 3. GSPC board
echo "  GSPC..."
GSPC=$(curl -sf https://councilof.ai/api/gspc 2>/dev/null | python3 -c "
import sys,json
d=json.load(sys.stdin)
t=d.get('totals',{})
print(json.dumps({
    'axes': t.get('axes'),
    'measured_axes': t.get('measured_axes'),
    'public_leader_count': t.get('public_leader_count'),
    'public_count': t.get('public_count'),
    'lid': t.get('lid')
}))
" 2>/dev/null || echo '{}')

# 4. Root
echo "  Root..."
ROOT=$(curl -sf https://councilof.ai/root.json 2>/dev/null | python3 -c "
import sys,json
d=json.load(sys.stdin)
print(json.dumps({
    'card_count': d.get('card_count'),
    'merkle_root': d.get('merkle_root','')[:16]+'...',
    'as_of': d.get('as_of')
}))
" 2>/dev/null || echo '{}')

# 5. HF downloads
echo "  HuggingFace..."
HF=$(curl -sf "https://huggingface.co/api/datasets?author=csoai&limit=100" 2>/dev/null | python3 -c "
import sys,json
d=json.load(sys.stdin)
total = sum(ds.get('downloads',0) or 0 for ds in d)
print(json.dumps({'datasets': len(d), 'total_downloads': total}))
" 2>/dev/null || echo '{}')

# 6. GitHub
echo "  GitHub..."
GH=$(gh api repos/CSOAI-ORG/councilof-ai --jq '{stars: .stargazers_count, watchers: .watchers_count, forks: .forks_count, open_issues: .open_issues_count}' 2>/dev/null || echo '{}')

# 7. Endpoint health
echo "  Endpoints..."
HEALTH=$(for url in \
  "https://councilof.ai" \
  "https://councilof.ai/api/gspc" \
  "https://councilof.ai/api/state" \
  "https://councilof.ai/api/revenue" \
  "https://councilof.ai/feed.xml" \
  "https://councilof.ai/sitemap.xml" \
  "https://councilof.ai/llms.txt" \
  "https://councilof.ai/.well-known/agent-card.json" \
  "https://councilof.ai/.well-known/x402.json" \
  "https://councilof.ai/api/x402" \
  "https://councilof.ai/root.json"; do
  code=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 8 "$url" 2>/dev/null || echo "000")
  echo "$url:$code"
done | python3 -c "
import sys,json
lines = [l.strip().split(':') for l in sys.stdin if l.strip()]
results = []
for parts in lines:
    url = ':'.join(parts[:-1])
    code = parts[-1]
    results.append({'url': url, 'status': int(code), 'ok': int(code) in (200,301,302)})
total = len(results)
healthy = sum(1 for r in results if r['ok'])
print(json.dumps({'total': total, 'healthy': healthy, 'unhealthy': total - healthy}))
" 2>/dev/null)

# Assemble snapshot
python3 -c "
import json, sys
revenue = json.loads('''$REVENUE''')
receipts = json.loads('''$RECEIPTS''')
gspc = json.loads('''$GSPC''')
root = json.loads('''$ROOT''')
hf = json.loads('''$HF''')
gh = json.loads('''$GH''')
health = json.loads('''$HEALTH''')

snapshot = {
    'schema': 'csoai.tui6-snapshot/1.0',
    'generated_at': '$DATE',
    'revenue': {
        'settled_usdc_atomic': revenue.get('settled_usdc',{}).get('count'),
        'issuances': revenue.get('skus',{}).get('issuance',{}).get('count'),
        'distinct_payers': revenue.get('one_number',{}).get('all_time'),
        'self_settlements': revenue.get('one_number',{}).get('self_settlements'),
        'zero_value': revenue.get('one_number',{}).get('zero_value_settlements'),
    },
    'receipts': {
        'status': receipts.get('status'),
        'count': receipts.get('count'),
    },
    'board': gspc,
    'root': root,
    'huggingface': hf,
    'github': gh,
    'endpoint_health': health,
}

print(json.dumps(snapshot, indent=2))
" > "$OUT"

echo "Snapshot written to $OUT"
cat "$OUT"
