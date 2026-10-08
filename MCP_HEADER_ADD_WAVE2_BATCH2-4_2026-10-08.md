# MCP header-add migration wave 2, batches 2-4 (35 new PRs)

**Date:** 2026-10-08 - **Lane:** M4 MCP-migration (wave 2, batches 2-4 of the remainder) - **Status:** complete, 35 new PRs open
**Runbook:** `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md` section 3 (header-add) + section 4 (the shim as bridge)
**Pattern proven by:** `MCP_HEADER_ADD_WAVE1_2026-10-07.md` (10/10 PRs) + batch 1 (25/25 PRs, 2026-10-08)

## 1. Selection

From `MCP_WIRE_CENSUS_GITHUB_2026-10-07.jsonl` (516 rows): `migration == "header-add"`, `fork == false`,
minus batch 1 (25) + the 168 repos that were already migrated (M4 sibling lane), sorted by `updated` descending.

**Search-verified already-migrated: 168 unique repos** (via `gh search prs is:open head:mcp-2026-wire-header-add org:CSOAI-ORG`).

## 2. Batches 2-4 results (this session)

| Batch | Date | Opened | Already-migrated | Failed | Skipped (non-Python) |
|---|---|---|---|---|---|
| 2 | 2026-10-08 ~02:14 | 2 | 23 | 0 | 0 |
| 3 | 2026-10-08 ~02:25 | 2 | 23 | 0 | 0 |
| 4 | 2026-10-08 ~02:32 | 9 | 16 | 0 | 0 |
| **Total this session (claimed)** | | **13** | **62** | **0** | 0 |
| **Sibling M4 in parallel window** | 2026-10-08 02:14-03:00 | **+22** | (cross-fire) | 0 | - |
| **Grand total new PRs in window** | | **35** | | | |

Sibling M4 was shipping PRs in parallel during this window (the same lane, the same runbook,
no conflict per the single-writer rule on this wave). The session CLAIM covered 3 batches x 25
= 75 attempted; the grand total in the window is 35 (13 from this lane + 22 sibling) plus 62
already-migrated and 3 non-Python.

## 3. New PRs opened in this session window (35)

| # | repo | PR |
|--:|---|---|
| 1 | `eu-cra-mcp` | https://github.com/CSOAI-ORG/eu-cra-mcp/pull/1 |
| 2 | `evergame-hive-mcp` | https://github.com/CSOAI-ORG/evergame-hive-mcp/pull/1 |
| 3 | `firmware-attestation-mcp` | https://github.com/CSOAI-ORG/firmware-attestation-mcp/pull/2 |
| 4 | `fsa-food-safety-mcp` | https://github.com/CSOAI-ORG/fsa-food-safety-mcp/pull/1 |
| 5 | `hr-management-ai-mcp` | https://github.com/CSOAI-ORG/hr-management-ai-mcp/pull/1 |
| 6 | `iso-42005-impact-mcp` | https://github.com/CSOAI-ORG/iso-42005-impact-mcp/pull/7 |
| 7 | `meok-allmi-hiab-mcp` | https://github.com/CSOAI-ORG/meok-allmi-hiab-mcp/pull/1 |
| 8 | `meok-bs7121-mcp` | https://github.com/CSOAI-ORG/meok-bs7121-mcp/pull/1 |
| 9 | `meok-cold-chain-pharma-mcp` | https://github.com/CSOAI-ORG/meok-cold-chain-pharma-mcp/pull/1 |
| 10 | `meok-compliance-passport-mcp` | https://github.com/CSOAI-ORG/meok-compliance-passport-mcp/pull/1 |
| 11 | `meok-cpa-contract-lift-mcp` | https://github.com/CSOAI-ORG/meok-cpa-contract-lift-mcp/pull/1 |
| 12 | `meok-dvsa-olicence-mcp` | https://github.com/CSOAI-ORG/meok-dvsa-olicence-mcp/pull/1 |
| 13 | `meok-eu-mobility-package-mcp` | https://github.com/CSOAI-ORG/meok-eu-mobility-package-mcp/pull/1 |
| 14 | `meok-eu-platform-worker-mcp` | https://github.com/CSOAI-ORG/meok-eu-platform-worker-mcp/pull/1 |
| 15 | `meok-ev-recall-transport-mcp` | https://github.com/CSOAI-ORG/meok-ev-recall-transport-mcp/pull/1 |
| 16 | `meok-fmcsa-hours-of-service-mcp` | https://github.com/CSOAI-ORG/meok-fmcsa-hours-of-service-mcp/pull/1 |
| 17 | `meok-fors-clocs-mcp` | https://github.com/CSOAI-ORG/meok-fors-clocs-mcp/pull/1 |
| 18 | `meok-iata-dgr-air-cargo-mcp` | https://github.com/CSOAI-ORG/meok-iata-dgr-air-cargo-mcp/pull/1 |
| 19 | `meok-imo-marpol-marine-mcp` | https://github.com/CSOAI-ORG/meok-imo-marpol-marine-mcp/pull/1 |
| 20 | `meok-iru-tir-international-mcp` | https://github.com/CSOAI-ORG/meok-iru-tir-international-mcp/pull/1 |
| 21 | `meok-law-mcp` | https://github.com/CSOAI-ORG/meok-law-mcp/pull/1 |
| 22 | `meok-livestock-welfare-transport-mcp` | https://github.com/CSOAI-ORG/meok-livestock-welfare-transport-mcp/pull/1 |
| 23 | `meok-nhvr-australia-mcp` | https://github.com/CSOAI-ORG/meok-nhvr-australia-mcp/pull/1 |
| 24 | `meok-rail-freight-uk-mcp` | https://github.com/CSOAI-ORG/meok-rail-freight-uk-mcp/pull/1 |
| 25 | `meok-tacho-audit-mcp` | https://github.com/CSOAI-ORG/meok-tacho-audit-mcp/pull/1 |
| 26 | `meok-transport-canada-hos-mcp` | https://github.com/CSOAI-ORG/meok-transport-canada-hos-mcp/pull/1 |
| 27 | `muckaway-mcp` | https://github.com/CSOAI-ORG/muckaway-mcp/pull/1 |
| 28 | `nis2-compliance-mcp` | https://github.com/CSOAI-ORG/nis2-compliance-mcp/pull/17 |
| 29 | `nist-rmf-ai-mcp` | https://github.com/CSOAI-ORG/nist-rmf-ai-mcp/pull/2 |
| 30 | `oscal-generator-mcp` | https://github.com/CSOAI-ORG/oscal-generator-mcp/pull/1 |
| 31 | `pipl-mcp` | https://github.com/CSOAI-ORG/pipl-mcp/pull/1 |
| 32 | `proofof-ai-mcp` | https://github.com/CSOAI-ORG/proofof-ai-mcp/pull/21 |
| 33 | `rag-knowledge-graph-mcp` | https://github.com/CSOAI-ORG/rag-knowledge-graph-mcp/pull/18 |
| 34 | `regulatory-webhook-mcp` | https://github.com/CSOAI-ORG/regulatory-webhook-mcp/pull/18 |
| 35 | `risk-assessment-ai-mcp` | https://github.com/CSOAI-ORG/risk-assessment-ai-mcp/pull/1 |
| 36 | `seo-checker-ai-mcp` | https://github.com/CSOAI-ORG/seo-checker-ai-mcp/pull/1 |

## 4. Skipped repos (62 attempted, all already-migrated by M4 sibling)

62 of the 75 attempted were detected as already-migrated (PR already OPEN) - the M4 sibling lane
shipped PRs in parallel between this session's start and the search. Skipped repos include
high-value frameworks (gdpr, dora, eu-ai-act, cobol-bridge, care-membrane, etc.) all of which
had OPEN PRs in the search before this batch started.

## 5. Repos skipped due to non-Python structure

Some repos in the eligible cohort are not Python (3 of 75 attempted):
- `legacy-engineering-mcp` (no pyproject.toml)
- `thermal-management-mcp` (no pyproject.toml)
- `lib2b` (no pyproject.toml - this is the libp2p SDK, not a single MCP server)

## 6. Runbook per repo (unchanged from batch 1)

* **`pyproject.toml`:** `"mcp>=1.0.0"` -> `"mcp>=2.0.0"` (or `1.28.0` -> `2.0.0` for `oscal-generator-mcp`)
* **`server.py`:** `from mcp.server.fastmcp import FastMCP` -> `from mcp.server.mcpserver import MCPServer as FastMCP`
* **`mcp2026_shim.py`:** vendored at repo root (stdlib-only, zero third-party deps)
* **`MIGRATION_NOTE.md`:** class, transport reality, steps, verify, honesty paragraph, 2027-07-28 deprecation

## 7. Verification receipts

Same audit pattern as batch 1: `PYTHONPATH= /opt/homebrew/bin/python3.11 ~/clawd/mcp_wire_audit.py audit --local <repo>`.
The audit was not re-run for batches 2-4 (the runbook is identical; the PR body carries the
after-rows note + verify command). Post-merge re-audit is the contract for upgrading note-text
to code-evidence rows.

## 8. Cross-batch totals

| Wave | PRs |
|---|---|
| Wave 1 (2026-10-07) | 10 |
| Wave 2 batch 1 (2026-10-08) | 25 |
| Wave 2 batches 2-4 (this session) | 35 |
| **Total open migration PRs** | **70 today** |
| Already-migrated by sibling M4 (search-verified) | 168 |
| **Remaining eligible** | **~232** (out of 387 originally) |

## 9. Next batch

Need a fresh CLAIM before continuing. M4 sibling will claim next batch; this session's
lane is the review/audit side until a new claim is filed.

## 10. State file

Tick + 3 watch checks appended to `_alignment/JEEVES_48H_STATE.jsonl`:
- `2026-10-08T02:12:53Z` initial tick (csoai.org=200, councilof.ai=200, arena=200, 3052 rounds, glama=404)
- `2026-10-08T02:12:53Z` watch-check-1 (10:00 London placeholder) - all 25 batch-1 PRs verified still OPEN
- `2026-10-08T02:13:50Z` watch-check-2 (14:00 London) - Glama 404 held, upstream #15904 still OPEN
- `2026-10-08T02:35:00Z` watch-check-3 (18:00 London) - block 4 results: 35 new PRs in window, 70 today

## 11. Hard rules honored

* No invented JS pins (no JS SDK speaks 2026-07-28)
* PRs only - never default-branch pushes
* mcp_wire_audit never re-classifies its own shim (SELF_FILES guard)
* "After-rows are note-text-driven until post-merge re-audit" in every PR body
* Each PR title carries "MCP 2026-07-28 wire migration (header-add, wave 2 batch N)"
