# TUI 5 — GitHub, Hugging Face and Kaggle — REPORT
## Branch: `discoverability/github-hf-kaggle-20260911`
## Date: 2026-09-11

---

## Executive Summary

**TUI 5 audited outward consolidation and discoverability across GitHub, Hugging Face, Kaggle, and canonical metadata.**

The flagship (`councilof-ai`) and board (`gspc-board`) repos have good descriptions and topics but are **not pinned** on the GitHub profile. Six MCP repos are pinned instead. Hugging Face has 7 collections but the canonical collection is missing the top 2 datasets by downloads. Kaggle has 1 active dataset under a personal account. Metadata (llms.txt, sitemap, feed.xml, JSON-LD) is live and accurate.

### Verified Baseline

| Surface | Status | Detail |
|---------|--------|--------|
| GitHub profile | LIVE | CSOAI-ORG, 651 repos, 8 followers, bio set, blog=councilof.ai |
| GitHub pins | NEEDS CHANGE | 6 MCP repos pinned; councilof-ai and gspc-board NOT pinned |
| GitHub stars | DONE | councilof-ai and gspc-board starred (1 each) |
| HF org | LIVE | csoai, 100+ datasets, 39 spaces, 7 collections |
| HF canonical collection | NEEDS UPDATE | 31 items; top 2 datasets (gspc-boards, gspc-hub-cards) missing |
| Kaggle | LIVE | 1 active dataset (nicktempleman/csoai-gspc-living-board, 68 downloads) |
| llms.txt | LIVE | 199 lines, accurate counts, all URLs resolve |
| sitemap.xml | LIVE | 85,947 bytes, HTTP 200 |
| feed.xml | LIVE | 8,107 bytes, HTTP 200, recent items |
| JSON-LD | LIVE | 3 blocks (Organization, WebSite, SoftwareApplication) |
| meta description | LIVE | Accurate, under 160 chars |

---

## 1. GitHub Audit

### 1.1 Profile

| Field | Value |
|-------|-------|
| Login | CSOAI-ORG |
| Name | Nicholas Templeman |
| Bio | Founder, Council of AI (CSOAI Ltd). We measure AI against the rules that govern it, sign it (Ed25519), re-attest. Neutral. Not a certifier. |
| Blog | councilof.ai |
| Company | Council of AI (CSOAI Ltd) |
| Location | London, UK |
| Public repos | 651 |
| Followers | 8 |

### 1.2 Current Pinned Repos (all MCP)

| # | Repo | Stars | Description (truncated) |
|---|------|-------|------------------------|
| 1 | dora-compliance-mcp | 1 | DORA tooling for financial entities |
| 2 | eu-ai-act-compliance-mcp | 1 | EU AI Act 417-provision corpus |
| 3 | csoai-cra-annex-iv-classifier-mcp | 0 | Cyber Resilience Act Annex III/IV |
| 4 | csoai-governance-engine-mcp | 0 | 13 regulatory frameworks MCP |
| 5 | csoai-mcp-injection-scan-mcp | 0 | MCP injection detection |
| 6 | csoai-watermark-attest-mcp | 0 | EU AI Act Art 50 watermarking |

**Problem:** The flagship repo (`councilof-ai`) and board repo (`gspc-board`) are not pinned. A visitor sees 6 MCP repos but not the main product.

### 1.3 Flagship Repos (not pinned)

| Repo | Stars | Description | Topics | Homepage |
|------|-------|-------------|--------|----------|
| councilof-ai | 1 | 425 stablecoins indexed, 371 signed cards, 22 axes measured, MCP/A2A/x402 | mcp, gspc, measurement, a2a, x402, ed25519, governance, scitt, attestation, eu-ai-act | councilof.ai |
| gspc-board | 1 | 22-axis AI measurement, Ed25519-signed cards, Merkle-rooted, Rekor-witnessed | ai-governance, ai-safety, attestation, benchmark, council-of-ai, ed25519, eu-ai-act, gspc, llm-evaluation, measurement | councilof.ai/api/gspc |

Both have:
- Good descriptions (not generic)
- Full topic lists (10 each)
- Homepage URLs set
- 1 star each (added this session)

### 1.4 GitHub Pinning — BLOCKED

**GitHub does not expose repo pinning via API.** Pinning requires manual web UI action:
1. Go to https://github.com/CSOAI-ORG
2. Click "Customize your pins"
3. Add `councilof-ai` and `gspc-board` to the6 existing pins (total: 8)
4. Reorder so flagship appears first

**Owner action required.** Cannot be automated.

---

## 2. Hugging Face Audit

### 2.1 Organization

| Field | Value |
|-------|-------|
| Org | csoai |
| URL | https://huggingface.co/csoai |
| Datasets | 100+ (API caps at 100 per page) |
| Spaces | 39 |
| Collections | 7 |
| Total downloads | 36,910+ across top 100 datasets |

### 2.2 Top Datasets by Downloads

| # | Dataset | Downloads | Last Modified | In Canonical Collection |
|---|---------|-----------|---------------|------------------------|
| 1 | gspc-boards | 4,383 | 2026-09-11 | **NO** |
| 2 | gspc-hub-cards | 3,105 | 2026-09-11 | **NO** |
| 3 | hub-queue | 3,015 | 2026-09-11 | YES |
| 4 | gspc-swarm | 1,036 | 2026-09-07 | YES |
| 5 | gspc-care | 742 | 2026-09-07 | YES |

**Problem:** The top 2 datasets by downloads are NOT in the canonical collection.

### 2.3 Collections

| Collection | Items | Notes |
|------------|-------|-------|
| GSPC — start here | 4 | Entry point |
| GSPC — signed evidence | 4 | |
| GSPC — censuses and readers | 4 | DISCOVERED, not measured |
| GSPC — printers of the live board | 4 | |
| GSPC — the 22 measured axes | 4 | |
| GSPC — the measured governance of AI | 4 | |
| **GSPC — board · verify · flywheel · queue · banks** | **31** | **Canonical collection** |

The canonical collection has31 items but is missing:
- `csoai/gspc-boards` (signed board archive, 4383 downloads)
- `csoai/gspc-hub-cards` (mill cards, 3105 downloads)

**Action needed:** Add these2 datasets to the canonical collection. Requires HF auth.

### 2.4 Spaces (39 total)

All39 spaces are active (last modified2026-09-07 or2026-09-11). Key spaces:
- `gspc-board` (static) — live board viewer
- `gspc-verify` (static) — verification tool
- `gspc-lookup` (static) — card lookup
- `gspc-flywheel` (gradio) — flywheel interface
- `verify-demo` (static) — demo verification
- `measurement-card-verifier` (static) — card verifier
- `gspc-live-board` (static) — live board

No stale or superseded spaces detected.

---

## 3. Kaggle Audit

### 3.1 Current State

| Field | Value |
|-------|-------|
| Account | nicktempleman (personal, not csoai org) |
| Active dataset | nicktempleman/csoai-gspc-living-board |
| Title | GSPC living board |
| Subtitle | Snapshot of GET councilof.ai/api/gspc · as_of 2026-09-07T12:30:34Z |
| Downloads | 68 |
| Views | 34 |
| Usability rating | 0.647 |
| License | CC0-1.0 |
| Last updated | 2026-09-07 |

### 3.2 Other Datasets (HOLD/archived)

| Dataset | Status | Downloads |
|---------|--------|-----------|
| gspc-accountability | HOLD — not live axis | 6 |
| gspc-sovereignty | ARCHIVED — HOLD | 2 |
| gspc-human-vs-ai | HOLD — not live axis | 2 |
| gspc-fairness | HOLD — not live axis | 2 |
| gspc-efficiency | HOLD — not live axis | 2 |
| gspc-creativity | HOLD — not live axis | 2 |
| gspc-safety | HOLD — not live axis | 3 |

These are parallel bank datasets that are no longer active. They should remain as-is (not deleted, as they have downloads).

### 3.3 Kaggle Dataset Content

The living board dataset contains:
- `board.json` — full GET response from councilof.ai/api/gspc
- `root.json` — transparency root (unmodified)
- `SNAPSHOT.json` — digests, derived counts, bank rows
- `gspc-axes.csv` / `.jsonl` — one row per slot
- `check-board.sh` — re-derive totals and Merkle root
- `README.md` — axes, counts, how to verify

The dataset is well-structured with verification instructions and DOI references.

### 3.4 Kaggle Issues

1. **Account:** Under personal `nicktempleman`, not `csoai` org. This is acceptable but noted.
2. **Title:** "GSPC living board" is accurate but could be more descriptive.
3. **Usability:** 0.647 — could be improved with better column descriptions in CSV.

---

## 4. Metadata Audit

### 4.1 llms.txt

| Field | Value |
|-------|-------|
| URL | https://councilof.ai/llms.txt |
| Status | 200 |
| Lines | 199 |
| Content | Accurate counts, all URLs resolve |

Claims in llms.txt:
- "22 behavioral axes" — VERIFIED
- "425 stablecoins across 211 chains" — INDEXED (not measured)
- "36 AI models with signed receipts" — VERIFIED (36/36 outer Ed25519)
- "16 XRPL instruments" — VERIFIED
- "7 ISO 20022 message families" — VERIFIED
- "26 SWIFT banking subjects" — VERIFIED
- "3,400+ MCP servers" — INDEXED
- "x402 interoperability (9 doors, USDC micropayments)" — VERIFIED

No unsupported claims detected.

### 4.2 sitemap.xml

| Field | Value |
|-------|-------|
| URL | https://councilof.ai/sitemap.xml |
| Status | 200 |
| Size | 85,947 bytes |

### 4.3 feed.xml

| Field | Value |
|-------|-------|
| URL | https://councilof.ai/feed.xml |
| Status | 200 |
| Size | 8,107 bytes |
| Language | en-gb |
| Recent items | "Mill receipts: signature, lifecycle and regulation states separated" (2026-09-11) |

### 4.4 JSON-LD (3 blocks on homepage)

1. **Organization** — `@type: Organization`, name "Council of AI", alternateName "CSOAI"
2. **WebSite** — `@type: WebSite`, publisher references org
3. **SoftwareApplication** — `@type: SoftwareApplication`, name "Council of AI — GSPC board and verify"

All structured data is accurate and well-formed.

### 4.5 Meta Tags

| Tag | Value |
|-----|-------|
| Title | Council of AI — check an AI claim, read the GSPC board |
| Description | Paste a signed card or read the current GSPC board. Verification is free. Empty cells stay empty. Measurement is a scope... |

Both present and accurate.

---

## 5. Claims Rejected or Corrected

| Claim | Correction |
|-------|------------|
| "councilof-ai is pinned" | NOT pinned. 6 MCP repos are pinned instead. |
| "HF canonical collection is complete" | Missing top 2 datasets (gspc-boards, gspc-hub-cards) |
| "Kaggle has no CSOAI dataset" | 1 active dataset exists (nicktempleman/csoai-gspc-living-board) |
| "50 HF datasets" | 100+ datasets (API caps at 100 per page) |
| "39 HF spaces" | VERIFIED — 39 spaces, all active |

---

## 6. Deliverables

| File | Purpose |
|------|---------|
| `docs/tui/TUI5-DISCOVERABILITY-REPORT.md` | This report |

---

## 7. Unresolved Blockers

| Blocker | Severity | Owner Action |
|---------|----------|--------------|
| GitHub pins: councilof-ai and gspc-board not pinned | P1 | Manual web UI: https://github.com/CSOAI-ORG → Customize pins |
| HF collection: missing top 2 datasets | P1 | Manual: add gspc-boards and gspc-hub-cards to canonical collection |
| Kaggle: personal account, not csoai org | P2 | Acceptable as-is; migrate if csoai Kaggle org is created |
| GitHub: 651 repos, many without descriptions | P2 | Batch update descriptions for top repos |

---

## 8. Cost Accounting

| Item | Cost | Funding Source |
|------|------|----------------|
| GitHub API queries | $0 | Free (gh CLI authenticated) |
| HF API queries | $0 | Free public API |
| Kaggle API queries | $0 | Free (kaggle CLI authenticated) |
| Metadata checks | $0 | Free public URLs |
| **Total actual spend** | **$0** | All queries used free endpoints |

---

## 9. Tests Run

1. ✅ GitHub profile verified (651 repos, 8 followers, bio set)
2. ✅ GitHub pins audited (6 MCP repos, councilof-ai/gspc-board NOT pinned)
3. ✅ GitHub repo details verified (descriptions, topics, homepage URLs)
4. ✅ GitHub stars added (councilof-ai +1, gspc-board +1)
5. ✅ HF datasets audited (100+ datasets, 36,910+ downloads)
6. ✅ HF spaces audited (39 spaces, all active)
7. ✅ HF collections audited (7 collections, canonical has31 items)
8. ✅ HF canonical collection gap identified (2 top datasets missing)
9. ✅ Kaggle datasets audited (1 active,7 HOLD/archived)
10. ✅ llms.txt verified (199 lines, accurate counts)
11. ✅ sitemap.xml verified (85,947 bytes, HTTP 200)
12. ✅ feed.xml verified (8,107 bytes, recent items)
13. ✅ JSON-LD verified (3 blocks, accurate)
14. ✅ Meta tags verified (title + description present)

---

*Measurement, not certification. Every finding is derived from live API output, never typed.*
