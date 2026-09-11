# TUI 5 Consolidation Report — GitHub / HF / Kaggle Discoverability

**Date:** 2026-09-11
**Branch:** `discoverability/consolidation-20260911`
**Auditor:** JEEVES (automated audit via GitHub API, HF API, Kaggle API)
**Org:** CSOAI-ORG (GitHub user account, 651 public repos)

---

## 1. GitHub Repo Audit

### 1.1 Baseline

| Metric | Value |
|--------|-------|
| Public repos | 651 |
| Account type | User (not org) |
| Followers | 8 |
| Highest-starred repo | 3 stars (iso-27001-ai-mcp) |
| Active in Sep 2026 | ~480+ repos (bulk-push batch Sep 3-5) |
| Stale >6 months | 1 (c2pa-node, last push Sep 2025) |
| Stale >3 months | ~74 repos (before Jun 2026) |
| Archived | 10 repos |
| Forks | 31 repos |

### 1.2 Top 20 by Stars (sample)

| # | Repo | Stars | Description | Topics | Home | Last Push |
|---|------|-------|-------------|--------|------|-----------|
| 1 | iso-27001-ai-mcp | 3 | ISO 27001 MCP | 13 topics | NO_HOME | 2026-09-04 |
| 2 | music-production-ai-mcp | 2 | Music production MCP | 12 topics | meok.ai | 2026-09-04 |
| 3 | contract-review-ai-mcp | 2 | Contract analysis MCP | 6 topics | meok.ai | 2026-09-04 |
| 4 | agent-rate-limiter-mcp | 1 | Fleet rate limiter | 9 topics | NO_HOME | 2026-06-26 |
| 5 | blockchain-verification-mcp | 1 | Blockchain verification | 7 topics | NO_HOME | 2026-09-04 |
| 6 | coppa-ferpa-mcp | 1 | Children's privacy | 7 topics | meok.ai | 2026-06-26 |
| 7 | csoai-governance-crosswalk-mcp | 1 | 13-framework crosswalk | 10 topics | meok.ai | 2026-09-04 |
| 8 | dora-compliance-mcp | 1 | DORA compliance | 16 topics | meok.ai | 2026-09-04 |
| 9 | eu-ai-act-compliance-mcp | 1 | EU AI Act corpus | 10 topics | meok.ai | 2026-09-04 |
| 10 | explainability-report-mcp | 1 | AI explainability | 12 topics | NO_HOME | 2026-09-04 |
| 11 | fda-samd-mcp | 1 | FDA SaMD compliance | 17 topics | meok.ai | 2026-06-26 |
| 12 | iso-42001-ai-mcp | 1 | ISO 42001 AIMS | 14 topics | meok.ai | 2026-09-04 |
| 13 | legal-tech-ai | 1 | Legal tech MCP | 8 topics | meok.ai | 2026-09-04 |
| 14 | meok-attestation-verify | 1 | Attestation verifier | 7 topics | NO_HOME | 2026-06-26 |
| 15 | pet-care-ai-mcp | 1 | Pet care MCP | 9 topics | meok.ai | 2026-09-04 |
| 16 | pipl-mcp | 1 | China PIPL compliance | 7 topics | NO_HOME | 2026-06-12 |
| 17 | proofof-ai-mcp | 1 | Content provenance | 3 topics | meok.ai | 2026-09-06 |
| 18 | qidi-printer-mcp | 1 | 3D printer MCP | 11 topics | NO_HOME | 2026-09-04 |
| 19 | real-estate-listing-mcp | 1 | Real estate MCP | 9 topics | meok.ai | 2026-09-04 |
| 20 | sbom-cyclonedx-mcp | 1 | SBOM compliance | 18 topics | meok.ai | 2026-09-03 |

**CRITICAL OBSERVATION:** Neither `councilof-ai` (0 stars) nor `gspc-board` (0 stars) appear in the top 20. The flagship repos are invisible.

### 1.3 Flagship Repo Status

#### councilof-ai
- **Description:** Present and accurate
- **Homepage:** https://councilof.ai
- **Topics:** 12 (mcp, gspc, measurement, a2a, x402, ed25519, governance, scitt, attestation, eu-ai-act, mcp-server, provenance)
- **Stars:** 0
- **Releases:** None
- **Last push:** 2026-09-11
- **Verdict:** Description and topics are excellent. Missing: releases, pinned status.

#### gspc-board
- **Description:** Present and accurate
- **Homepage:** https://councilof.ai/api/gspc
- **Topics:** 14 (ai-governance, ai-safety, attestation, benchmark, council-of-ai, ed25519, eu-ai-act, gspc, llm-evaluation, measurement, open-data, provenance, signed-evidence, transparency)
- **Stars:** 0
- **Releases:** None
- **Last push:** 2026-09-07
- **Verdict:** Description and topics are excellent. Missing: releases, pinned status.

### 1.4 Repos Missing Descriptions (2)

- `csoai-global`
- `mcp-get`

### 1.5 Repos Missing Topics (~49)

Notable missing topics on important repos:
- `awesome-mcp-list` / `awesome-mcp-servers-1` / `awesome-mcp-servers-2` (awesome lists)
- `c2pa-node` / `c2pa-python` / `c2pa-rs` (C2PA forks)
- `claimguard` (ClaimGuard checker)
- `labs-OO-Agents` (NVIDIA mirror)
- `meok-bft-verifier` (BFT verifier)
- `sovos-core` (legacy scorer)
- `sov3-arch-demo` / `sov3-beat-demo` / `sov3-live-demo` (demos)
- Multiple site repos (`cobolbridge-site`, `diyhelp-site`, etc.)

### 1.6 Repos with Old Codenames (flag for cleanup)

| Repo | Description | Status |
|------|-------------|--------|
| oci-sovos-governance | OCI SOVOS governance reference | Still has "SOVOS" in name + desc |
| sov3-arch-demo | SOV 27-vertex demo | Internal codename in desc |
| sov3-beat-demo | SOV3 BEAT demo | Internal codename in desc |
| sov3-live-demo | DEFONEOS LIVE DEMO | Internal codename in desc |
| sov3-topology | MEOK empire component | Internal codename in desc |
| sovos-core | GSPC scorer | Internal codename in name |

### 1.7 Archived Repos (10)

`appcypher-awesome-mcp-servers`, `awesome-devops-mcp-servers`, `awesome-mcp-list`, `awesome-mcp-servers-1`, `awesome-mcp-servers-2`, `cobol-bridge`, `consciousness-engine-mcp`, `csoai-global`, `geolocation-ai-mcp`, `mcp-get`

These are already archived — no action needed.

### 1.8 Repos That Should Be Considered for Archiving

| Repo | Last Push | Reason |
|------|-----------|--------|
| c2pa-node | 2025-09-19 | 12 months stale, fork of upstream |
| sovos-core | 2026-08-10 | Superseded by gspc-board |
| oci-sovos-governance | 2026-08-10 | Internal codename, niche OCI ref |
| wolf-actuator | 2026-06-13 | Mirror, unclear value |
| a-evolve | 2026-06-13 | Mirror, unclear value |
| meok-sdk-python / go / typescript | 2026-06-12-13 | Stale SDK stubs |

### 1.9 Current Pins (6 MCP repos)

1. dora-compliance-mcp (1 star)
2. eu-ai-act-compliance-mcp (1 star)
3. csoai-cra-annex-iv-classifier-mcp (0 stars)
4. csoai-governance-engine-mcp (0 stars)
5. csoai-mcp-injection-scan-mcp (0 stars)
6. csoai-watermark-attest-mcp (0 stars)

**Problem:** All 6 are compliance MCPs. No flagship (councilof-ai), no board data (gspc-board), no verifier. A visitor sees "compliance tooling" but not "AI measurement body."

### 1.10 Pin Recommendations (6 repos)

| # | Repo | Why |
|---|------|-----|
| 1 | **councilof-ai** | Flagship. The one repo that IS the product. |
| 2 | **gspc-board** | Live board data. The thing people come to verify. |
| 3 | **eu-ai-act-compliance-mcp** | Highest-regulation MCP, strongest signal of depth. |
| 4 | **csoai-governance-crosswalk-mcp** | 13-framework crosswalk = unique capability. |
| 5 | **proofof-ai-mcp** | Content provenance = timely, differentiating. |
| 6 | **iso-27001-ai-mcp** | Highest-starred MCP (3 stars), broad appeal. |

---

## 2. Hugging Face Audit

### 2.1 Datasets (50 total)

Top 5 by downloads:
| Dataset | Downloads | Last Modified |
|---------|-----------|---------------|
| csoai/gspc-boards | 4,383 | 2026-09-11 |
| csoai/hub-queue | 3,015 | 2026-09-11 |
| csoai/gspc-swarm | 1,036 | 2026-09-07 |
| csoai/gspc-prv | 697 | 2026-09-07 |
| csoai/gspc-art5 | 709 | 2026-09-07 |

All 50 datasets are live and recently updated. No stale or broken datasets found.

### 2.2 Spaces (39 total)

| Category | Count | Examples |
|----------|-------|---------|
| Static | 35 | gspc-live-board, gspc-verify, council-space, etc. |
| Gradio | 2 | gspc-governance-leaderboard, gspc-flywheel |
| Docker | 2 | gspc-node, gspc-mill |

**Superseded space identified:** `csoai/gspc-live-board` — its own description says "SUPERSEDED mirror -- use csoai/gspc-board." However, it is NOT disabled. The collection "GSPC -- start here" still references it at position 1.

### 2.3 Collections (7 total)

| Collection | Items | Last Updated |
|-----------|-------|--------------|
| GSPC -- start here | 4 | 2026-09-11 |
| GSPC -- signed evidence | 4 | 2026-09-04 |
| GSPC -- censuses and readers | 4 | 2026-09-04 |
| GSPC -- printers of the live board | 4 | 2026-09-04 |
| GSPC -- the 22 measured axes | 4 | 2026-09-04 |
| GSPC -- the measured governance of AI | 4 | 2026-09-02 |
| GSPC -- board, verify, flywheel, queue, banks | 4 | 2026-08-31 |

**Finding:** 7 collections exist, each with exactly 4 items. This is well-organized but may confuse visitors — too many collections, each too small. Consider consolidating into 1-2 canonical collections.

### 2.4 HF Recommendations

1. **Disable `csoai/gspc-live-board` space** (or add redirect banner) — it self-identifies as superseded
2. **Consolidate collections:** Merge "start here" + "signed evidence" + "printers" + "board/verify/flywheel/queue/banks" into one "GSPC -- start here" mega-collection. Keep "22 measured axes" and "censuses" separate.
3. **Add csoai/hub-queue to "start here" collection** — it has 3,015 downloads and is the census queue

---

## 3. Kaggle Audit

### 3.1 Dataset Status

| Dataset | Status | Downloads | Last Updated |
|---------|--------|-----------|--------------|
| nicktempleman/csoai-gspc-living-board | LIVE | 68 | 2026-09-07 |
| nicktempleman/csoai-signed-measurement-cards | ARCHIVED | 137 | 2026-08-15 |
| nicktempleman/gspc-defbench | DEPRECATED | 50 | 2026-08-06 |
| nicktempleman/gspc-ossbench | DEPRECATED | 33 | 2026-08-06 |
| nicktempleman/gspc-govbench | DEPRECATED | 47 | 2026-08-06 |
| nicktempleman/gspc-sim-cards | HOLD | 9 | 2026-08-23 |
| nicktempleman/oowm-ground-truth-v9 | ARCHIVED | 7 | 2026-09-06 |
| nicktempleman/csoai-corpus-baselines | LIVE | 48 | 2026-08-01 |
| nicktempleman/gspc-hf-model-census | LIVE | 2 | 2026-09-03 |

Plus ~10 "HOLD parallel bank" datasets (gspc-accountability, gspc-continuity, gspc-efficiency, gspc-fairness, gspc-safety, gspc-transparency, gspc-creativity, gspc-human-vs-ai, gspc-slot15, gspc-sovereignty).

### 3.2 Kaggle Recommendations

1. **Canonical asset:** `nicktempleman/csoai-gspc-living-board` is live and verifiable. It should be the one Kaggle reference in llms.txt (already is).
2. **Consider deleting or hiding** the ~10 "HOLD parallel bank" datasets — they are explicitly marked as "not live axis" and add noise.
3. **Update deprecated datasets** (`gspc-defbench`, `gspc-ossbench`, `gspc-govbench`) with clear "use gspc-det/gspc-oss/gspc-agi" redirects in their descriptions.

---

## 4. Metadata Maintenance

### 4.1 Sitemap (`public/sitemap.xml`)

- **Status:** CURRENT
- **Size:** 3,021 lines, comprehensive
- **lastmod dates:** All set to 2026-09-11
- **Coverage:** Homepage, about, academy, axes, benchmarks, all major pages
- **Verdict:** Well-maintained. No stale entries detected.

### 4.2 llms.txt (`public/llms.txt`)

- **Status:** CURRENT and carefully maintained
- **Size:** 199 lines
- **Key claims verified:**
  - 22 axes measured — matches live API
  - 3 public leader scores — consistent
  - Live API endpoints listed — all point to councilof.ai
  - HF org link present: https://huggingface.co/csoai
  - Kaggle link present: nicktempleman/csoai-gspc-living-board
  - Zenodo DOI present
  - MCP endpoints documented (HTTP + stdio)
- **Verdict:** Excellent. This is the canonical agent-readable manifest.

### 4.3 RSS/Feed

- **feed.xml:** Generated dynamically via `functions/feed.xml.ts` (Cloudflare Pages function), not a static file
- **RSS:** `functions/rss.xml.ts` exists as dynamic generator
- **Static feeds:** `public/interop/feed.json`, `public/interop/corrections-feed.json` exist
- **llms.txt references:** Correctly lists `https://councilof.ai/feeds/corrections.xml`, `/feeds/cards.xml`, `/feeds/roots.xml`, `/api/press.json`, and the older `/feed.xml`
- **Verdict:** Feed infrastructure is solid. Dynamic generation means feeds stay current without manual maintenance.

### 4.4 JSON-LD

- **Homepage (`index.html`):** Has Organization JSON-LD with name, alternateName, legalName, url, logo, sameAs (GitHub, csoai.org), description. **Well-formed.**
- **Coverage:** 378 HTML files contain `application/ld+json` blocks across the repo
- **Axis pages:** All 22 axis pages have JSON-LD
- **Benchmark pages:** All have JSON-LD
- **Subdomain pages:** All have JSON-LD
- **Verdict:** Comprehensive JSON-LD coverage. No gaps found.

---

## 5. Blockers and Action Items

### P0 (Do now — pin changes)

1. **Pin councilof-ai** — replace one of the current MCP pins
2. **Pin gspc-board** — replace one of the current MCP pins
3. **Pin csoai-governance-crosswalk-mcp** — unique 13-framework crosswalk
4. **Pin proofof-ai-mcp** — timely provenance checker

### P1 (This week)

5. **Add topics to ~49 repos** — especially awesome lists, C2PA forks, claimguard, meok-bft-verifier
6. **Add descriptions to 2 repos** (csoai-global, mcp-get)
7. **Disable or redirect HF space `csoai/gspc-live-board`** — self-described as superseded

### P2 (This sprint)

8. **Add release tags to councilof-ai and gspc-board** — even a v0.1.0 tag signals activity
9. **Clean up Kaggle "HOLD parallel bank" datasets** — delete or hide ~10 noise datasets
10. **Consider archiving stale repos** (c2pa-node, sovos-core, wolf-actuator, a-evolve)
11. **Update old codename repos** — at minimum update descriptions on sov3-* demos

### P3 (Backlog)

12. **Consolidate HF collections** from 7 to 2-3
13. **Add homepage URL to repos missing it** (~30+ repos have NO_HOME)
14. **Consider creating GitHub Releases** on flagship repos for version tracking

---

## 6. Summary

| Surface | Status | Score |
|---------|--------|-------|
| GitHub pins | 6 MCPs, no flagship | 2/10 |
| GitHub descriptions | 649/651 have descriptions | 9/10 |
| GitHub topics | ~602/651 have topics | 7/10 |
| GitHub releases | No releases on any repo | 1/10 |
| HF datasets | 50 live, well-maintained | 9/10 |
| HF spaces | 39 live, 1 superseded not disabled | 7/10 |
| HF collections | 7 exist, well-organized | 8/10 |
| Kaggle | 1 canonical dataset live | 7/10 |
| Sitemap | Current, comprehensive | 10/10 |
| llms.txt | Current, accurate | 10/10 |
| RSS/Feeds | Dynamic, auto-updating | 9/10 |
| JSON-LD | 378 files, comprehensive | 10/10 |

**Overall discoverability gap:** The measurement infrastructure (sitemap, llms.txt, JSON-LD, feeds, HF data) is excellent. The **GitHub profile presentation** is the weakest link — pins show compliance MCPs instead of the flagship measurement product, and no repos have releases. A visitor landing on CSOAI-ORG sees "compliance tooling" rather than "independent AI measurement body."

---

*Report generated 2026-09-11 by JEEVES automated audit. Data sourced from GitHub REST API, HF API, Kaggle API, and local repo inspection.*
