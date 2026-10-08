# MCP header-add migration wave 2, batch 3 (25 repos)

**Date:** 2026-10-08 - **Lane:** M4 MCP-migration (wave 2, batch 3) - **Status:** complete, 25/25 slice repos carry an open, full-runbook header-add PR (0 new PRs opened - see section 2)  
**Runbook:** `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md` section 3 (header-add) + section 4 (the shim as bridge)  
**Pattern:** batch-1 recipe (`MCP_HEADER_ADD_WAVE2_BATCH1_2026-10-08.md`) + wave-1 pattern doc.  
**Scope:** the exact 25 repos in `~/.hermes/cache/scratch/mig-batch3-slice.json`, branch `mcp-2026-wire-header-add`, base = `main`, PR-only (no default-branch write, no force, no clones - reads via `gh api` + `raw.githubusercontent.com`).  
**Deprecation deadline carried in every PR:** the legacy wire dies **2027-07-28**.

## 1. Selection

The slice file listed **25 unique repos**. Existence / archived / fork check against
`gh api repos/CSOAI-ORG/<repo>`: **25/25 exist, 0 archived, 0 forks -> 0 skips, 0 substitutions**.
All 25 are census `MCP_WIRE_CENSUS_GITHUB_2026-10-07.jsonl` rows with
`migration: header-add`, `fork: false`, `era: unknown`, and none overlaps batch 1's 25.

## 2. Decisive finding: all 25 already had an open PR on this branch

Before any write, the lane ran a head-filter probe
(`GET repos/.../pulls?head=CSOAI-ORG:mcp-2026-wire-header-add&state=open`) across the slice:

* **25/25 repos already had an open PR** with head `mcp-2026-wire-header-add`, base `main`.
* GitHub allows exactly one open PR per head/base pair, so **opening a second PR was impossible
  without either a second branch name (forbidden by this lane's rules) or a duplicate PR.**
* Two prior lanes had split the slice:

| prior group | repos | opened | files in their PR | runbook state found |
|---|---|---|---|---|
| **"stateless-wire header-add" lane** | 14 | 00:53-01:05Z | 2 (`MIGRATION_NOTE.md`, `mcp2026_shim.py`) | **no SDK pin, no FastMCP->MCPServer rename, no `server.py` note block, no wrapper wiring** - yet the PR *body* claimed the pin and the rename |
| **wave 2 batch 2** | 11 | 02:24-02:29Z | 4 (note, shim, `pyproject.toml`, entry `server.py`) | pin + rename present; **no `server.py` note block, no packaging include for the shim, no wrapper wiring**; `muckaway-mcp` PR claimed 4 files but had 2 |

So batch 3's work was **not** "open 25 PRs" - it was "make the 25 open PRs actually match the
batch-1 runbook, and put the before/after/control audit rows + honesty caveat in every body".

## 3. What batch 3 did (all writes = `PUT contents` / `PATCH pulls` on `mcp-2026-wire-header-add`)

**64 code-file PUTs + 25 `MIGRATION_NOTE.md` appends + 25 PR-body appends = 114 writes, 0 failures**
(2 transient EOFs were retried once and succeeded). Nothing was written to any default branch
(sampled `GET contents/MIGRATION_NOTE.md?ref=main` -> 404 and `server.py@main` without banner on
`csoai-ap2-mandate-mcp`, `pipl-mcp`, `nis2-compliance-mcp`).

Defects found on the pre-existing branches and fixed by this batch:

1. **14 repos had no SDK pin at all** (PR body said otherwise) -> `pyproject.toml` now carries the
   real dep line pinned `"mcp>=1.0.0"` / `"mcp[cli]>=1.3.0"` / `"mcp>=1.28.0"` / `"mcp>=1.2.0"` ->
   `"mcp[... ]>=2.0.0"`, plus the packaging include for the shim. **No pin was invented anywhere**:
   `muckaway-mcp` has no `mcp` dependency line (it runs on the third-party `fastmcp` package) and was
   deliberately left unpinned.
2. **14 repos had no FastMCP->MCPServer rename** -> applied line-by-line in every file importing
   `mcp.server.fastmcp` (24/25 repos; `muckaway-mcp` imports `from fastmcp import FastMCP`, a
   different package - untouched).
3. **`nis2-compliance-mcp` batch-2 rename was broken**: its line read
   `from mcp.server.mcpserver import MCPServer as FastMCP  # ... renamed MCPServer, Context`, which
   drops `Context` entirely, and `meok_x402.py` still imported `from mcp.server.fastmcp import
   Context` (which raises `ModuleNotFoundError` under the new pin). Both fixed.
4. **All 25 lacked the `server.py` migration-note block** -> added (with the `http_app()`
   `ShimASGI(...)` enable path on stdio repos, comment-only where an HTTP wrapper owns the ingress).
5. **8 batch-2 `pyproject.toml` files were missing the shim packaging include** -> added
   (`py-modules += "mcp2026_shim"` / `only-include += "mcp2026_shim.py"`). `pipl-mcp` and
   `eu-cra-mcp` needed none (their `packages.find include = ["meok_*"]` already ships the package).
6. **All 12 repos with an HTTP entry point were missing the ingress wiring** -> `mcp-wrapper.py` now
   runs `ShimASGI(mcp_server.streamable_http_app(json_response=True))` and its served
   `protocolVersion` / `mcp_version` literals moved 2025-11-25 -> 2026-07-28 (this step was absent
   from every pre-existing PR in the slice). **This took two passes**: the batch-3 patch script's
   `__main__` regex was off by one character, so the first pass only bumped the literals while the
   action log claimed the full wiring; the lane caught it on the post-write spot-check, re-fetched
   each wrapper from the branch, wrapped the `__main__` block in `ShimASGI(...)` (24 calls, 12/12
   PUTs ok) and re-verified `ShimASGI` / `import uvicorn` / `2026-07-28-wire` on-branch
   (`a2a-governance-bridge-mcp`, `seo-checker-ai-mcp`), with `mcp-wrapper.py@main` still untouched.
7. **4 package-layout repos** (`csoai-dora-tlpt-planner-mcp`, `csoai-fria-generator-mcp`,
   `pipl-mcp`, `eu-cra-mcp`) got an **in-package** `mcp2026_shim.py` as well, because the prior
   lanes' root-level shim does not ship in those wheels (`hatch packages=[...]` / `packages.find include`).
   The prior root copies were left in place - two identical shims on 4 repos is a consolidation
   follow-up, not a silent delete.
8. **Every `MIGRATION_NOTE.md`** (theirs, preserved verbatim) got an appended
   *"Batch-3 verification addendum"* with the before/after/control table, the verify command and the
   honesty paragraph; **every PR body** got a *"Batch-3 addendum"* with the same table.

## 4. Results - 25 PRs (read back after the writes)

| # | repo | PR | prior lane | before (local audit) | after | control | files | batch-3 added | CI |
|--:|---|---|---|---|---|---|---:|---|---|
| 1 | `a2a-governance-bridge-mcp` | #13 | earlier lane | 2025-11 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | `server.py`, `pyproject.toml`, `mcp-wrapper.py` | tests ok |
| 2 | `agent-negotiation-mcp` | #15 | earlier lane | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | `server.py`, `pyproject.toml`, `mcp-wrapper.py` | tests ok |
| 3 | `ai-bom-mcp` | #8 | earlier lane | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4 | `server.py`, `pyproject.toml` | tests ok |
| 4 | `ai-self-audit-mcp` | #9 | earlier lane | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | `server.py`, `pyproject.toml`, `mcp-wrapper.py` | tests ok |
| 5 | `bias-detection-mcp` | #9 | earlier lane | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4 | `server.py`, `pyproject.toml` | tests ok |
| 6 | `care-membrane-mcp` | #25 | earlier lane | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | `server.py`, `pyproject.toml`, `mcp-wrapper.py` | tests ok |
| 7 | `clinical-trials-ai-mcp` | #18 | earlier lane | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | `server.py`, `pyproject.toml`, `mcp-wrapper.py` | tests ok |
| 8 | `csoai-ap2-mandate-mcp` | #1 | earlier lane | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4 | `server.py`, `pyproject.toml` | tests ok |
| 9 | `csoai-coinbase-x402-receipt-mcp` | #1 | earlier lane | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4 | `server.py`, `pyproject.toml` | tests ok |
| 10 | `csoai-dora-tlpt-planner-mcp` | #1 | earlier lane | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 5 | `meok_dora_tlpt_planner/server.py`, `pyproject.toml`, `meok_dora_tlpt_planner/mcp2026_shim.py` | tests ok |
| 11 | `csoai-eu-ai-act-art-26-fria-mcp` | #1 | earlier lane | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4 | `server.py`, `pyproject.toml` | tests ok |
| 12 | `csoai-fria-generator-mcp` | #1 | earlier lane | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 5 | `meok_fria_generator/server.py`, `pyproject.toml`, `meok_fria_generator/mcp2026_shim.py` | tests ok |
| 13 | `csoai-mcp-cardgen-mcp` | #1 | earlier lane | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4 | `server.py`, `pyproject.toml` | tests ok |
| 14 | `csoai-nis2-nl-register-mcp` | #1 | earlier lane | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4 | `server.py`, `pyproject.toml` | no test job yet |
| 15 | `eu-cra-mcp` | #1 | batch 2 | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 5 | `meok_eu_cra_mcp/server.py`, `meok_eu_cra_mcp/mcp2026_shim.py` | no test job yet |
| 16 | `hr-management-ai-mcp` | #1 | batch 2 | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | `server.py`, `pyproject.toml`, `mcp-wrapper.py` | tests ok |
| 17 | `muckaway-mcp` | #1 | batch 2 | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 3 | `src/muckaway_mcp/server.py` | mypy pre-existing fail |
| 18 | `nis2-compliance-mcp` | #17 | batch 2 | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 6 | `server.py`, `pyproject.toml`, `mcp-wrapper.py`, `meok_x402.py` | tests ok |
| 19 | `nist-rmf-ai-mcp` | #2 | batch 2 | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | `server.py`, `pyproject.toml`, `mcp-wrapper.py` | tests ok |
| 20 | `oscal-generator-mcp` | #1 | batch 2 | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4 | `server.py`, `pyproject.toml` | tests ok |
| 21 | `pipl-mcp` | #1 | batch 2 | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 5 | `meok_pipl_mcp/server.py`, `meok_pipl_mcp/mcp2026_shim.py` | no test job yet |
| 22 | `rag-knowledge-graph-mcp` | #18 | batch 2 | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | `server.py`, `pyproject.toml`, `mcp-wrapper.py` | tests ok |
| 23 | `regulatory-webhook-mcp` | #18 | batch 2 | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | `server.py`, `pyproject.toml`, `mcp-wrapper.py` | tests ok |
| 24 | `risk-assessment-ai-mcp` | #1 | batch 2 | 2025-11 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | `server.py`, `pyproject.toml`, `mcp-wrapper.py` | tests ok |
| 25 | `seo-checker-ai-mcp` | #1 | batch 2 | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | `server.py`, `pyproject.toml`, `mcp-wrapper.py` | tests ok |

**Read-back (independent GraphQL pull, all 25):** `state: OPEN` 25/25, `base: main` 25/25,
`head: mcp-2026-wire-header-add` 25/25, `changed_files` = 5 (15 repos), 4 (8), 6 (`nis2-compliance-mcp`),
3 (`muckaway-mcp`); PR body contains the audit table 25/25 and the line
**"After-rows are note-text-driven until post-merge re-audit."** 25/25.

## 5. Verification receipts

Local audits ran against a fully reconstructed default-branch tree per repo (every scannable file
fetched via `raw.githubusercontent.com`), before patching, after patching, and with only the
migration-note block deleted (control):

| state | repos | reading |
|---|---|---|
| before | 18 | `2026-07 / header-add` (17 from `.well-known/agent-card.json` `mcp_name` / static 2025-11-25 decls, 1 `oscal-generator-mcp` from an existing `protocol-2026-07-28` declaration - scanner false-positive classes, not wire behaviour) |
| before | 2 | `2025-11 / header-add` (`a2a-governance-bridge-mcp`, `risk-assessment-ai-mcp` - served `protocolVersion: 2025-11-25`) |
| before | 5 | `unknown / header-add` (package-layout repos) |
| **after (this branch)** | **25** | **`2026-07 / handshake-removal`** |
| control (note block removed) | 20 | `2026-07 / header-add` |
| control (note block removed) | 5 | `unknown / header-add` |

**On-branch re-audit (stronger than the local tree):** for 3 sample repos the lane re-fetched the
*actual GitHub branch tree* of `mcp-2026-wire-header-add` into a clean directory and re-ran the
auditor: `csoai-ap2-mandate-mcp`, `nis2-compliance-mcp`, `pipl-mcp` -> all three
`2026-07 / handshake-removal`, i.e. the after-row is reproducible from the branch itself.

**Read the `after` column honestly:** the scanner excludes its own shim (`SELF_FILES`) and does not
scan `.md`, so `protocol-2026-07-28` / `mcp-method-header` / `mcp-name-header` / `server-discover` are
read from the migration-note text in the entry file, and `session-id` is prose about the shim
*stripping* that header. Runtime evidence for the wire is the `mcp>=2.0.0` pin (2.3.0 speaks
2026-07-28) plus the vendored shim at the ingress; `mcp>=2.0.0` alone is not a wire signal for this
scanner. **After-rows are note-text-driven until post-merge re-audit.**

**CI receipts (check-runs on each PR head, sampled 03:00Z):** 21/25 have their `test` job(s)
**green** with zero failing checks; 3 (`pipl-mcp`, `eu-cra-mcp`, `csoai-nis2-nl-register-mcp`) had a
check still queued at sampling time; 1 (`muckaway-mcp`) fails only the `Run type checks` (mypy) step
- **pre-existing**: `muckaway-mcp`'s `main` branch CI is red on 2026-06-13, 2026-06-06 and
2026-06-06 too, and the `Run tests` step on this branch passes. Green suites include the repos that
received the `mcp>=2.0.0` pin + `MCPServer` rename + note block in this batch, i.e. the pin and the
import really install and run under mcp 2.x.

## 6. API budget and rate discipline

* **~395 counted `gh api` calls** of the 600 hard cap: 50 discovery (25 repo meta + 25 trees),
  25 tree re-fetch (the first pass did not persist blob paths - a script bug, no re-do of meta),
  25 pre-flight head probes, 70 branch-file reads, 139 completion writes (25 trees + 64 PUTs +
  25 note PUTs + 25 body PATCHes), 3 EOF retries, 1 GraphQL body fetch, 1 GraphQL read-back,
  25 CI check sweeps, 24 wrapper-fix writes, ~34 spot/verification reads. `gh api rate_limit`
  probes do not count and read 5000/5000 at the end of the hourly window.
* 0.3 s pacing, 30 s backoff armed for secondary limits: **0 secondary-limit hits.**
  Two transient `EOF` writes (not in the original retry list) were retried once and succeeded.
* **Wall time: ~60 minutes** (02:15 UTC start -> 03:15 UTC report), inside the 90-minute budget.

## 7. Known gaps carried forward

* **No new PR was opened by this lane.** If the coordinator wanted *fresh* PRs, that was impossible
  on this branch name: the branch and PR already existed on 25/25 repos. Re-running batch 3 must
  first check `pulls?head=CSOAI-ORG:mcp-2026-wire-header-add` - that check costs 1 call per repo and
  would have saved the whole discovery phase.
* **The earlier lane's 14 PR bodies still contain claims written before this batch** (they claimed
  the pin/rename when the diff had neither). This batch made those claims true by adding the missing
  files; the original body text was left intact and the batch-3 addendum states exactly what was
  added when.
* `muckaway-mcp`: no `mcp` dependency line (third-party `fastmcp>=2.0.0`) -> **no pin invented**, no
  `http_app()` helper, its shim stays at the repo root (no code imports it). Moving it onto the
  official SDK is a follow-up, not a silent dependency edit.
* **Two identical shims on 4 package-layout repos** (prior root copy + batch-3 in-package copy).
  Consolidate after merge; deleting the prior lane's file was not this batch's call.
* Static declaration surfaces (`.well-known/*.json`, `server.json`, `smithery.yaml`, `README.md`)
  still declare older wires - follow-ups in each `MIGRATION_NOTE.md`, not silent-edited (Art. 21).
* `muckaway-mcp` mypy CI failure is red on `main` since June 2026 - out of scope for this lane.
* The `after` audit rows are note-text-driven (section 5): re-audit after merge and after the live
  probe of plan section 6.5 before anyone quotes `migration: none`.
* **No git commit in `~/clawd`** - the parent lane commits this report.

## 8. Artifacts

* `MCP_HEADER_ADD_WAVE2_BATCH3_2026-10-08.md` - this report.
* Per repo, on `mcp-2026-wire-header-add`: batch-3 commits on `pyproject.toml` / entry `server.py` /
  `mcp-wrapper.py` / `meok_x402.py` / in-package `mcp2026_shim.py`, plus the audit addendum in
  `MIGRATION_NOTE.md` and in the PR body.
* Scratch (pruned after 24 h): `~/.hermes/cache/scratch/mig3b_{discover,trees,fetch,before,patch,audit,note,push,complete}.py`,
  `mig3b_{discovery,trees,before,patch,audits,existing_prs,existing_analysis,branchfiles,bodies,actions,readback,ci_checks}.json`,
  `mig-batch3-slice.json` (input).
* `/tmp/mig3b` (reconstructed trees) removed at the end of this run.
