# CSOAI Distribution Monitoring

**Generated:** 2026-09-12
**Purpose:** Track discovery, engagement, payments and repeat usage across all surfaces.

---

## Monitoring Sources

| Metric | Source | Frequency | Attribution ID |
|--------|--------|-----------|----------------|
| Website visits | Cloudflare Analytics | Daily | SURF-web |
| API requests | Cloudflare Analytics | Daily | SURF-api-* |
| RSS subscribers | Feed analytics | Weekly | SURF-rss |
| HF dataset downloads | HuggingFace API | Daily | SURF-hf |
| Kaggle dataset downloads | Kaggle API | Daily | SURF-kaggle |
| GitHub stars | GitHub API | Daily | SURF-github |
| GitHub watchers | GitHub API | Daily | SURF-github |
| MCP tool invocations | Server logs | Real-time | SURF-mcp |
| x402 challenges | /api/revenue | Real-time | SURF-x402 |
| x402 deliveries | /api/receipts/latest | Real-time | SURF-x402 |
| x402 settlements | /api/revenue | Real-time | SURF-x402 |
| External citations | Web search | Weekly | — |
| Reply rate | Email tracking | Per contact | CON-* |

## Monitoring Commands

```bash
# Check HF downloads
curl -s "https://huggingface.co/api/datasets?author=csoai&limit=5" | python3 -c "
import sys,json
for d in json.load(sys.stdin):
    print(f'{d[\"id\"]}: {d[\"downloads\"]} downloads')
"

# Check revenue
curl -s https://councilof.ai/api/revenue | python3 -c "
import sys,json
d=json.load(sys.stdin)
for sku,info in d['skus'].items():
    print(f'{sku}: count={info[\"count\"]} status={info[\"status\"]}')
print(f'settled_usdc: {d.get(\"settled_usdc\",{}).get(\"count\",\"null\")}')
"

# Check receipts
curl -s https://councilof.ai/api/receipts/latest | python3 -c "
import sys,json
d=json.load(sys.stdin)
print(f'Status: {d[\"status\"]}')
print(f'Count: {d[\"count\"]}')
"

# Check GitHub
gh api repos/CSOAI-ORG/councilof-ai --jq '{stars: .stargazers_count, watchers: .watchers_count, forks: .forks_count}'
```

## Alert Thresholds

| Alert | Threshold | Action |
|-------|-----------|--------|
| Depeg | Price deviates >1% from peg | Investigate, publish correction |
| Supply drift | >10% change in 24h | Investigate, publish correction |
| Stale attestation | No update in 7 days | Flag as stale in readiness |
| Broken adapter | Reader returns error for >1h | Fix adapter, publish correction |
| New external payment | Any EXTERNAL_CUSTOMER settlement | Log, investigate, celebrate quietly |
| Repeat buyer | Same payer settles twice | Log, investigate demand signal |

## Yield Calculation

| Lane | Metric | Current | Target |
|------|--------|---------|--------|
| Verified cells | Cards in public root | 167 | 335 |
| Subjects covered | Deeply measured assets | 5 | 20 |
| Signatures produced | Ed25519 signed cards | 335 | 500 |
| Roots completed | Merkle root generations | 29 | 52 (weekly) |
| Rekor inclusions | WITNESSED roots | 1 | 52 |
| External users | HF downloads | ~25,000 | 50,000 |
| Independent payments | EXTERNAL_CUSTOMER | 0 | 1 |
| Repeat demand | Repeat buyers | 0 | 1 |
| Cost per evidence unit | Total spend / accepted cards | $0 | < $0.10 |
