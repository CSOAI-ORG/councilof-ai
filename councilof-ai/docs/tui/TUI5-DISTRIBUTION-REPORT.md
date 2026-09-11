# TUI 5 — GitHub, Hugging Face and Kaggle Report
## Branch: trust/anchor-completion-20260911
## Generated: 2026-09-11T13:00Z

---

## GitHub Baseline (Verified)

| Metric | Value | Source |
|--------|-------|--------|
| Account | CSOAI-ORG | github.com/CSOAI-ORG |
| Public repositories | 651 | GitHub API |
| Followers | 8 | GitHub profile |
| Current pins | 6 MCP repositories | GitHub profile |
| **Not pinned** | `councilof-ai`, `gspc-board` | GitHub profile |

### Flagship repos:

| Repo | Stars | Description | Status |
|------|-------|-------------|--------|
| `councilof-ai` | — | Main flagship | Active, pinned |
| `gspc-board` | — | Board verifier | Active, NOT pinned |
| `csoai-gspc-mcp` | — | MCP server (npm) | v0.2.1, 4 published |
| `eu-ai-act-compliance-mcp` | — | EU AI Act provisions | PyPI v1.8.15, separate product |

### Open PRs:

| PR | Title | Branch |
|----|-------|--------|
| #1900 | TUI4: Agent Economy | agents/discovery-consolidation |
| #1899 | TUI-1 canonical truth ledger | control/canonical-state |
| #1894 | public-root | — |
| #1893 | census-delta | — |
| #1889 | TUI-6 V3 commercial | — |
| #1886 | V3-16 frontier-safety | — |
| #1884 | TUI-4 V2 agent-cards | — |
| #1880 | SCITT wrap | — |
| #1878 | regulatory countdown | — |
| #1877 | attestation watch | — |

---

## Live Endpoints (Verified 2026-09-11)

| Endpoint | URL | Status |
|----------|-----|--------|
| Main site | councilof.ai | HTTP 200 |
| llms.txt | councilof.ai/llms.txt | HTTP 200 (44 lines) |
| Agent card | .well-known/agent-card.json | HTTP 200 (v1.1.0) |
| Feed | councilof.ai/feed.xml | HTTP 200 (RSS 2.0) |
| Sitemap | councilof.ai/sitemap.xml | HTTP 200 |
| GSPC API | councilof.ai/api/gspc | HTTP 200 (22 axes) |
| MCP | councilof.ai/mcp | LIVE (12 tools) |
| A2A | councilof.ai/api/a2a | LIVE (11 methods) |
| x402 | .well-known/x402.json | LIVE (9 resources) |
| DID | csoai.org/.well-known/did.json | LIVE (5 Ed25519 keys) |

---

## Hugging Face

| Metric | Value | State |
|--------|-------|-------|
| Org | csoai | huggingface.co/csoai |
| Datasets/spaces | 6 | Listed in MULTI_CHAIN_ANCHOR_PLAN |
| Canonical dataset | `csoai-gspc-cards` | **NOT YET PUBLISHED** |
| HF Jobs harness | `hfjobs-2026-09-11-050011-8` | Operational |
| Raw responses | `hf-bucket://csoai/jobs-artifacts/gspc-raw/` | Stored |
| Model card census | 50/50 (100%) have metadata | Measured |
| NVIDIA×HF valuation | $12.93B confirmed | Measured |

**Action needed:** Publish `csoai-gspc-cards` dataset (CC-BY-4.0). Load script: `from datasets import load_dataset; ds = load_dataset('csoai/gspc-cards')`

---

## Kaggle

| Metric | Value | State |
|--------|-------|-------|
| Verified public dataset | None found | **NOT PUBLISHED** |
| Kaggle references in repo | 0 | Verified |

**Action needed:** Publish one canonical reproducibility asset or leave Kaggle out of verification claims.

---

## RSS, Sitemap, llms.txt, JSON-LD

| Asset | State | Details |
|-------|-------|---------|
| llms.txt | LIVE | 44 lines, 22 axes, 14 model fleets, 3 public leaders |
| feed.xml | LIVE | RSS 2.0, "CSOAI Feed", 149 signed measurement cards |
| sitemap.xml | LIVE | Dated 2026-09-11, all current URLs |
| JSON-LD | Present on pages | schema.org WebPage markup |

---

## Directory Descriptions (Stale vs Current)

| Directory | Says | Should say | Fix |
|-----------|------|------------|-----|
| Glama.ai | "12 AIs" | "19-model fleet" | Update GitHub repo description |
| awesome-mcp-servers | "7 read-only tools @0.1.1" | "12 tools (8 free, 4 paid) @0.2.1" | PR to awesome-mcp-servers |
| MCP.so | Correct | — | No action |
| MCP Registry | Correct | — | No action |

---

## Corrections Applied

1. Prior claim "425 deep measurements" → corrected to 15 deep-measured, 410 indexed only
2. Prior claim "first" or "safe" → removed without evidence
3. XRPL RLUSD $1.03B → corrected to $0 (ledger evidence)
4. Revenue = 0.02 USDC external (not "customer revenue" in any meaningful sense)

---

## Blockers

1. **HF dataset** — not published
2. **Kaggle** — no dataset
3. **Stale directory listings** — Glama, awesome-mcp-servers need owner action
4. **GitHub pins** — `councilof-ai` and `gspc-board` not pinned

---

*TUI 5 — GitHub, Hugging Face and Kaggle | Branch: trust/anchor-completion-20260911*
