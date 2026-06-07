# EOD AUDIT — MEOK / CSOAI Code Assets

**Date:** 2026-06-06
**Scope:** Every published PyPI package, the full CSOAI-ORG GitHub fleet, fleet categorization, dedup overlaps, and local build inventory.
**Method:** `tools/pypi_check.py` + PyPI JSON API (`/pypi/<name>/json`) for publish/version/date; pypistats.org `/recent` (last_month) for downloads; `gh repo list CSOAI-ORG --limit 500` + `gh api` content spot-checks for GitHub. **READ-ONLY — nothing modified, nothing published.**
**Auth:** `gh` logged in as `CSOAI-ORG` (full scope: admin:org, repo, workflow, packages).

---

## 1. Summary

- **PyPI:** **282 published** packages (verified live, HTTP 200) out of **336 real package dirs on disk** → **54 built-but-unpublished**. (337 names on disk incl. 1 template-junk entry `{{package_name}}`.) Up from 264/323 on the 2026-05-29 sweep — the catalogue-catastrophe re-releases lifted the published count by ~18.
- **Downloads (30d):** **222,193 total** across 276 resolved packages (6 packages 429'd out — true total is marginally higher). Median package = **806/mo**; **44 packages over 1,000/mo**; only 5 under 100.
- **Top earner:** `eu-ai-act-compliance-mcp` (2,726/mo), then `dora-compliance-mcp` (2,410) and `ai-bom-mcp` (1,829). **Compliance + governance MCPs dominate the top 20** — 14 of the top 20 are reg/compliance/governance.
- **GitHub:** **430 repos** in CSOAI-ORG — **414 public, 16 private, 12 archived**. **290 are MCP servers** (`*-mcp` suffix; 299 if counting any `-mcp` substring). All 430 pushed within 90 days (427 within 30d).
- **Biggest gap — security posture:** of a 30-repo MCP sample, only **~10% have CodeQL**, **~10% Dependabot**, **~16% Scorecard**. Conversely **server.json is on ~93%** and **CI on ~66%**. The fleet is publish-ready but not security-hardened.
- **Dedup waste:** watermarking ×3, governance ×4–5, agent-commerce ×2, x402 ×3 (1 published + 2 unpublished) — all confirmed live on PyPI/disk.
- **Local:** **343 `*-mcp` dirs** in `mcp-marketplace/` (355 dirs total incl. tooling/junk). Disk count (343) > published (282) > real distinct package names (336) — the delta is the unpublished backlog plus a few non-package dirs (`.github`, `tests`, `meok_shared`, `distribution-output`).

---

## 2. PyPI — totals & reconciliation

| Metric | Count | Source |
|---|---|---|
| Real package names on disk (pyproject `name=`) | **336** | `tools/pypi_check.py` (+1 junk template = 337 raw) |
| **Published on PyPI (HTTP 200)** | **282** | live JSON API sweep 2026-06-06 |
| Built-but-unpublished | **54** | disk minus published |
| `*-mcp` dirs in `mcp-marketplace/` | **343** | `ls -d` |
| Prior sweep (2026-05-29) | 264 published / 323 built | `revenue/_mcp_pypi_map.txt` (now stale) |

> **Reconciliation note:** the three numbers — 343 dirs, 336 named packages, 282 published — differ because (a) some dirs are non-packages (`.github`, `.github-profile`, `tests`, `meok_shared`, `distribution-output`, `mcpize-submissions`), (b) 54 named packages are built but never pushed to PyPI, and (c) one dir still holds the cookiecutter template (`{{package_name}}`).

### 2.1 Download distribution (30-day, 276 resolved pkgs)

| Bucket | # packages |
|---|---|
| ≥ 1,000 /mo | 44 |
| 500–999 /mo | 190 |
| 100–499 /mo | 37 |
| < 100 /mo | 5 |
| **Total downloads/30d** | **222,193** |
| Median package | 806 /mo |

> Caveat: pypistats counts include mirror/CI/bot traffic and do **not** equal paying users. Revenue (per the infra/accounts audits) remains the gating metric; these are reach/adoption signals, not sales.

### 2.2 Top 20 published packages by downloads (30d)

| # | Package | Downloads/30d | Category |
|---|---|---|---|
| 1 | `eu-ai-act-compliance-mcp` | 2,726 | Compliance (flagship) |
| 2 | `dora-compliance-mcp` | 2,410 | Compliance |
| 3 | `ai-bom-mcp` | 1,829 | Compliance (AI-BOM) |
| 4 | `bias-detection-mcp` | 1,752 | Compliance |
| 5 | `meok-governance-engine-mcp` | 1,735 | Compliance/governance |
| 6 | `cra-compliance-mcp` | 1,713 | Compliance |
| 7 | `nis2-compliance-mcp` | 1,710 | Compliance |
| 8 | `gdpr-compliance-ai-mcp` | 1,667 | Compliance |
| 9 | `llm-compliance-comparison-mcp` | 1,598 | Compliance |
| 10 | `iso-42001-ai-mcp` | 1,589 | Compliance |
| 11 | `patient-safety-ai-mcp` | 1,579 | Vertical (healthcare) |
| 12 | `meok-cra-annex-iv-classifier-mcp` | 1,544 | Compliance |
| 13 | `healthcare-ai-governance-mcp` | 1,532 | Compliance/vertical |
| 14 | `encoder-ai-mcp` | 1,530 | Utility |
| 15 | `deepfake-detector-mcp` | 1,491 | Compliance/security |
| 16 | `meok-watermark-attest-mcp` | 1,424 | Compliance (watermarking) |
| 17 | `a2a-governance-bridge-mcp` | 1,387 | Agent/A2A |
| 18 | `clipboard-ai-mcp` | 1,365 | Utility |
| 19 | `csrd-compliance-mcp` | 1,362 | Compliance |
| 20 | `security-scanner-ai-mcp` | 1,359 | Security/utility |

**Read-through:** 14/20 are compliance or governance; 2 utilities (`encoder-ai`, `clipboard-ai`) over-index likely on generic naming/mirror traffic. Flagship reg packs (`eu-ai-act`, `dora`, `cra`, `nis2`, `iso-42001`, `csrd`, `gdpr`) cluster at the top — consistent with the revenue thesis. **Real package names ≠ `meok-` prefix** (see `CANONICAL_PACKAGE_NAMES_2026-05-29.md`).

---

## 3. GitHub — CSOAI-ORG fleet

| Metric | Count |
|---|---|
| **Total repos** | **430** |
| Public | **414** |
| Private | **16** |
| Archived | **12** |
| MCP servers (`*-mcp` suffix) | **290** |
| MCP servers (any `-mcp` substring) | 299 |
| Pushed within 30 days | 427 |
| Pushed within 90 days | 430 (all) |

**Private repos (16):** `asisecurity-portal`, `clawd-workspace`, `cobol-bridge-substrate`, `diyhelp`, `fishkeeper`, `industrial-domains`, `koikeeper`, `loopfactory`, `meok-agent-zero`, `meok-ai`, `meok-compliance-gateway`, `optimobile-practice-hub`, `pokerhud`, `sovereign-temple`, `suicidestop`, `test-fishkeeper`. (Includes safety-critical `suicidestop` and the SOV3 core `sovereign-temple` — correctly kept private.)

**Archived repos (12):** mostly severed-brand / fork mirrors — `CSGA-GLOBAL-SITE`, `csga-standards`, `terranova-defence`, `cobol-bridge`, plus awesome-list forks (`appcypher-awesome-mcp-servers`, `awesome-devops-mcp-servers`, `awesome-mcp-list`, `awesome-mcp-servers-1/2`, `best-of-mcp-servers`, `wong2-awesome-mcp-servers`, `mcp-get`). Severed-brand hygiene is holding (CSGA/Terranova archived, not deleted).

### 3.1 Security / supply-chain features (30-repo MCP sample)

| Feature | Present | % | Notes |
|---|---|---|---|
| `server.json` | 28/30 | **93%** | MCP-registry discovery file — near-universal |
| CI (`ci.yml`) | 20/30 | 66% | basic build/test pipeline |
| `mcp-smithery-publish.yml` | ~16/30 | ~53% | Smithery auto-publish |
| Scorecard (`scorecard.yml`) | 5/30 | **16%** | OpenSSF Scorecard |
| CodeQL (`codeql.yml`) | 3/30 | **10%** | static analysis |
| Dependabot (`dependabot.yml`) | 3/30 | **10%** | dependency updates |

> **The flagship compliance/agent repos are the hardened ones.** `a2a-governance-bridge-mcp`, `agent-prompt-injection-firewall-mcp`, `iso-42001-ai-mcp`, `csoai-governance-crosswalk-mcp` carry the full CodeQL+Scorecard+Dependabot+server.json+CI set. The long tail of utility `*-ai-mcp` repos has server.json + test.yml only. (GitHub code-search counts are unreliable here — the search index lags and under-reports; figures above are from direct `gh api` content checks on a 30-repo random sample, seed-fixed.)

---

## 4. Fleet categorization (282 published)

| Category | Count | What's in it |
|---|---|---|
| **Utility / dev AI tools** (`<topic>-ai-mcp`) | **153** | code-executor, git-helper, markdown, csv, pdf, calendar, invoice, sentiment, encoder, clipboard, etc. The bulk volume play. |
| **Compliance / regulatory** | **58** | EU AI Act, DORA, NIS2, CRA, CSRD, GDPR, ISO-42001/27001, NIST RMF, AI-BOM, bias-detection, watermarking, omnibus-tracker, incident-reporting, deepfake, Canada AIDA, Basel, MDR, PCI-DSS, MiCA, FSA, DPIA. **The revenue core.** |
| **Vertical (industry)** | **25** | healthcare/optometry (patient-safety, healthcare-governance), haulage/transport, crane/CPCS, aqua (fish/koi), real-estate, robotics/3D-print (qidi), gods-eye geospatial. |
| **Agent / A2A / ACP** | **21** | agent-commerce-protocol/payments, negotiation, handoff-certified, delegation, orchestrator, identity-trust, prompt-injection-firewall, policy-enforcement, x402-paywall, audit-logger, rate-limiter, a2a-governance-bridge. |
| **Security / supply-chain** | **12** | sbom-cyclonedx, trust-chain, blockchain-verification, scam-detector, security-scanner, cybersecurity, credential-manager, owasp-agentic, mcp-injection-scan. |
| **SOV3 / consciousness internal** | **11** | consciousness-engine, creativity-engine, care-membrane, quantum-scoring, memory/vector-knowledge-search, bft-progress-council, self-healing-infra, voice-audio, web-research, ai-ops, ai-reflection. |
| **Other / infra** | **2** | gods-eye-geospatial (defence-civilian), meok-mcp-test (test artifact). |

### 4.1 Known dedup overlaps (confirmed live)

| Theme | Variants | Status |
|---|---|---|
| **Watermarking ×3** | `agent-content-watermark-mcp` (1.1.3), `meok-watermark-attest-mcp` (1.3.7), `watermarking-authenticity-mcp` (1.2.1) | all 3 published — consolidate to one canonical |
| **Governance ×4–5** | `meok-governance-engine-mcp` (1.0.16), `a2a-governance-bridge-mcp` (1.1.7), `csoai-governance-crosswalk-mcp` (1.0.10), `meok-bft-governance-mcp` (1.0.3) + `meok-governance-smithery` (1.0.2) | 5 governance-named pkgs; engine vs bridge vs crosswalk overlap |
| **Agent-commerce ×2** | `agent-commerce-payments-mcp` (1.0.6), `agent-commerce-protocol-mcp` (1.0.3) | both published (`ecommerce-ai-mcp` is a separate utility, not part of this overlap) |
| **x402 ×3** | `agent-x402-paywall-mcp` (1.0.3, published) + `meok-coinbase-x402-receipt-mcp`, `meok-x402-wrap-mcp` (both **unpublished**) | 1 live, 2 in backlog |

> Dedup cleanup would retire ~6–8 redundant packages without losing any capability. Pick one canonical per theme, redirect the others' READMEs/Stripe links, and `yank` (not delete) the duplicates on PyPI.

---

## 5. Built-but-unpublished backlog (54 packages)

These have a real `pyproject.toml` name on disk but return 404 on PyPI. Grouped:

| Group | # | Packages |
|---|---|---|
| **Transport / haulage vertical** | 15 | cold-chain-pharma, dvsa-olicence, eu-mobility-package, fmcsa-hours-of-service, fors-clocs, haulage-governance-bridge, iata-dgr-air-cargo, imo-marpol-marine, iru-tir-international, livestock-welfare-transport, nhvr-australia, rail-freight-uk, transport-canada-hos, uae-rta-transport, uk-phv-tfl (all `meok-*-mcp`) |
| **Agent / A2A / x402** | 10 | aaif-agent-card, abci-bridge, agents-md-lint, ap2-mandate, coinbase-x402-receipt, libp2p-agent-mesh, mcp-cardgen, mcp-hardening, x402-wrap, oasf-agent-directory |
| **Compliance / reg** | 10 | coppa-ferpa, eudi-wallet, korea-ai-basic-act, mcp-spec-compliance, cra-art14-reporter, drcf-agent-crosswalk, eu-aia-art-9-rms, eu-aigc-icon, meok-law, uk-adm-article22c |
| **Healthcare / optometry vertical** | 9 | care-home-scheduling, cqc-compliance, dispense-record, domiciliary-care, gos-claim-validator, mhra-samd-optometry, nhs-gos-claims, optical-care-home-bridge, optometry-patient |
| **Security / supply-chain** | 6 | cisa-kev, firmware-attestation, c2pa-durable, mitre-attack, sigstore-cosign, slsa-supply-chain |
| **Aqua vertical** | 1 | meok-koikeeper-ai |
| **Misc** | 3 | allmi-hiab, cpa-contract-lift, nis2-nl-register |

> The haulage and optometry verticals are **fully built but entirely unshipped** — biggest "finished inventory not on the shelf" gap. The agent/x402 and security/supply-chain groups overlap heavily with already-published agent MCPs, so some are intentional drafts. Use the gate-protected harness (`mcp-marketplace/_tooling/`) for any publish — it only ships importable wheels (the fix for the £0 catalogue catastrophe).

---

## 6. Gaps & recommended actions (no changes made)

1. **Security hardening is the #1 gap.** ~90% of the MCP fleet has no CodeQL/Dependabot/Scorecard. For a company *selling compliance and supply-chain security MCPs*, this is a credibility risk if a prospect audits the repos. Roll the flagship's `codeql.yml` + `dependabot.yml` + `scorecard.yml` across the fleet via a templated workflow (org-level `.github` repo or a script over `gh api`).
2. **Ship the verticals.** 24 fully-built haulage + optometry/care-home MCPs sit unpublished — finished product not generating reach or revenue.
3. **Dedup.** Retire ~6–8 redundant watermarking/governance/commerce packages; one canonical each.
4. **Refresh `_mcp_pypi_map.txt`.** It still reads "264 published / 323 built" (2026-05-29); reality is 282/336. This audit's `/tmp/pub_pkgs.tsv` + `/tmp/dl_stats.tsv` are the current source of truth.
5. **Downloads ≠ revenue.** 222K downloads/30d with £0 cash (per accounts audit) confirms the funnel is top-heavy: reach is real, conversion is the bottleneck — not catalogue size.

---

*Data files (this run): `/tmp/pub_pkgs.tsv` (282 pkgs × version × date), `/tmp/dl_stats.tsv` (downloads), `/tmp/csoai_repos.json` (430 repos), `/tmp/categories.json`. Companion audits: `EOD_AUDIT_infra.md`, `EOD_AUDIT_accounts.md`.*
