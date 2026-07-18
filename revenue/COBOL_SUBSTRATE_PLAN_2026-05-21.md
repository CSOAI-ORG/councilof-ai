# COBOL Substrate — IP Reclaim + Substrate Play

**Discovery 2026-05-21 [RE-VERIFIED 2026-06-27]:** Nick (CSOAI-ORG) is **sole contributor across 91 commits** to `CSGA-GLOBAL/cobol-bridge` (PRIVATE, awaiting Nick sign-off for transfer per Option A). **No James Castle, no shared authorship.** UK copyright defaults to Nick. The CSGA-GLOBAL org just hosts the repo — the work is his. The brand is severed; the IP reverts to Nick.

## What we have

### Public repo — CSGA-GLOBAL/cobol-bridge (1.3 MB, 91 commits all CSOAI-ORG)

22 HTML pages already shipped:
- index, about, contact, docs, products, pricing, platform, sectors
- 7 industry verticals: banking, defence, healthcare, finance, government, insurance, real-time-payments
- 3 compliance: dora-compliance, ai-explainability, regulatory-digital-twin
- 1 product: cobol-bridge-express
- 1 deploy.sh + package.json + server.js (Node MCP server)

### Private repo — CSGA-GLOBAL/COBOLBRIDGE (2.4 MB)
- Kimi Agent deployment ZIP — likely full deployment package

### Private repo — CSGA-GLOBAL/COBOLBRIDGEAI (13 KB)
- Small HTML, exploratory

### Local — sovereign-stack/cobolbridge-ai
- `cobolbridge_transpiler.py` (218 lines)
- Integrates **FPT-Software/COBOL-Coder-14B** (HuggingFace) — **73.95% compile success vs GPT-4o 41.8%**
- Has both local-model and API-fallback paths

### Already published — CSOAI-ORG/cobol-bridge-mcp
- 36 KB Python MCP server
- On PyPI as `cobol-bridge-mcp`
- In Anthropic Registry (47 MEOK MCPs)

### Domain — cobolbridge.ai LIVE
- Currently serves our existing site
- Already 200 HTTP, custom domain on Vercel
- Updated branding from LoopFactory→MEOK earlier today

## The substrate play

The 5 tools from CSGA-GLOBAL/cobol-bridge map perfectly to a substrate:

| # | Tool | Maps to |
|---|---|---|
| 1 | Copybook Parser | New MCP `cobol-copybook-parser-mcp` |
| 2 | CICS Bridge Assessment | New MCP `cobol-cics-bridge-mcp` |
| 3 | JCL Batch Scanner | New MCP `cobol-jcl-scanner-mcp` |
| 4 | COBOL-Coder-14B Transpiler | Extend existing `cobol-bridge-mcp` |
| 5 | DORA/NIS2/AI Act Crosswalk | New MCP `cobol-governance-crosswalk-mcp` |

5 MCPs at £29/mo Starter each = £145/mo for someone who picks per-tool.
COBOL Substrate £999/mo = the bundle.

## Stripe products (LIVE)

| Tier | Price | Buy link | Stripe ID |
|---|---|---|---|
| COBOL Substrate Pro | £999/mo | https://buy.stripe.com/3cIfZj1BW7su4c5eGY8k90w | price_1TZRWeQ |
| COBOL Substrate Pro Annual | £9,990/yr (save £1,998) | https://buy.stripe.com/9B6bJ3eoIaEGgYRfL28k90x | price_1TZRWhQ |
| COBOL Substrate Defence | £4,990/mo | https://buy.stripe.com/8x25kF0xSeUW6kd0Q88k90y | price_1TZRWkQ |

## Migration steps (Nick's decision points)

### Option A: Transfer the public CSGA-GLOBAL/cobol-bridge repo to CSOAI-ORG

```bash
# Repo settings → Transfer ownership → CSOAI-ORG
# Or via API:
gh api -X POST repos/CSGA-GLOBAL/cobol-bridge/transfer \
  -f new_owner=CSOAI-ORG \
  -f new_name=cobol-bridge-substrate
```

**Pros:** preserves 91 commits' git history, GitHub redirects old URL.
**Cons:** Nick (as personal GitHub user) needs admin on CSGA-GLOBAL to do the transfer. If James Castle still has admin, he could block.

### Option B: Fork to CSOAI-ORG + archive original

```bash
gh repo fork CSGA-GLOBAL/cobol-bridge --org=CSOAI-ORG \
  --remote --remote-name=upstream
# Push to new origin, then:
# Archive CSGA-GLOBAL/cobol-bridge to prevent confusion
```

**Pros:** lower risk, no permission battle.
**Cons:** GitHub doesn't auto-redirect, and shows the work originated under CSGA-GLOBAL (which contradicts MEOK brand).

### Option C: Clean copy under new repo name

```bash
gh repo create CSOAI-ORG/cobol-bridge-substrate --public \
  --description="MEOK COBOL Substrate — 5 MCP tools for COBOL modernization"
# git push --mirror from local copy of CSGA-GLOBAL/cobol-bridge.git
```

**Pros:** completely clean break, new commit history, fresh branding.
**Cons:** loses the 91-commit history (could be valuable for showing engineering history).

### Recommendation: **Option A** — go for transfer. Nick has CSGA-GLOBAL admin (as the only active maintainer). If James Castle still has admin and refuses transfer, fall back to Option C.

## Rebrand pass needed during migration

All 22 HTML pages reference "CSGA Global" + "csga-global.org" + "@csga-global/" npm scope. Need scripted replacement:

```bash
find . -type f \( -name "*.html" -o -name "*.md" -o -name "*.json" -o -name "*.js" \) -exec \
  sed -i '' \
    -e 's/CSGA Global/MEOK AI Labs/g' \
    -e 's/csga-global\.org/meok.ai/g' \
    -e 's/@csga-global/@meok-ai/g' \
    -e 's/Cyber Security Global Alliance/MEOK AI Labs (CSOAI LTD)/g' \
    {} +
```

## Per-MCP build plan (after migration)

Extract the 5 tools from `server.js` into 5 standalone MCP packages:

1. **cobol-copybook-parser-mcp** — JSON-schema + PII detection
2. **cobol-cics-bridge-mcp** — RACF/ACF2/TopSecret assessment
3. **cobol-jcl-scanner-mcp** — Data lineage + dataset governance
4. **cobol-bridge-mcp** (existing — extend) — COBOL-Coder-14B transpiler integration
5. **cobol-governance-crosswalk-mcp** — DORA + NIS2 + EU AI Act mapping for mainframe estates

Each gets:
- pyproject.toml (Python wrapper around Node logic OR pure Python rewrite)
- server.json with `name: io.github.CSOAI-ORG/<slug>`
- README with Sister MCPs + Protocol Coverage block (auto-applied)
- Stripe Starter £29/mo per MCP via per-MCP buy links

Total portfolio after this expansion: **47 + 4 new = 51 MEOK MCPs**.

## How this connects to the existing substrates

- **A2A Substrate** signs every COBOL Substrate call into the audit chain
- **Governance Substrate** consumes COBOL output for EU AI Act Annex IV + DORA Article 28
- **Cybersec Substrate** consumes JCL scanner output for SBOM + supply chain attestations
- **Universal PAYG** lets a bank evaluate COBOL Substrate without committing to £999/mo

This is **the integration play** — every other substrate becomes a customer of COBOL Substrate when the buyer has a mainframe.

## Revenue trajectory if shipped

Target: 5 tier-2 bank pilots over Q3 2026 → 1 conversion to Defence (£4,990/mo) + 2 conversions to Pro (£999/mo each) = **£6,988/mo MRR from 3 customers**.

Stretch: 1 tier-1 bank takes Substrate Defence + reseller white-label = **£14,990/mo** by Q4 2026.

This is the highest single-customer revenue lever in the entire MEOK portfolio.

## Show HN angle (updated)

> Show HN: 51 MIT MCPs + COBOL Substrate (220B-line market) + 8 agent-interop protocols (MCP, A2A, Stripe ACP, AP2, x402)

The "220B lines of COBOL" is **the** hook — it's a number every HN regular has read about, the modernization market is well-known (£20-£50B), and "we have a substrate that works without re-platforming" is a clear, specific, testable claim.

## Sources

- CSGA-GLOBAL/cobol-bridge repo (private, 2026-03-08 — pre-severance): https://github.com/CSGA-GLOBAL/cobol-bridge [ARCHIVED-PENDING-NICK-SIGNOFF per csga_global_org_decision.md]
- FPT-Software COBOL-Coder-14B model: https://huggingface.co/FPT-Software/COBOL-Coder-14B
- 220B-line COBOL figure: Reuters / Reuters 2022 COBOL survey
- COBOL-Coder benchmark (73.95%): FPT-Software paper 2024
