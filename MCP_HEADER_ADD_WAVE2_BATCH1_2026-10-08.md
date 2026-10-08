# MCP header-add migration wave 2, batch 1 (25 PRs)

**Date:** 2026-10-08 - **Lane:** M4 MCP-migration (wave 2, batch 1 of the remainder) - **Status:** complete, 25/25 PRs open  
**Runbook:** `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md` section 3 (header-add) + section 4 (the shim as bridge)  
**Pattern proven by:** `MCP_HEADER_ADD_WAVE1_2026-10-07.md` (10/10 PRs) - same branch name, same steps, same verify.  
**Scope:** CSOAI-ORG repos only, branch `mcp-2026-wire-header-add`, base = each repo's default branch, no default-branch pushes, no force, no clones (reads via `gh api` + `raw.githubusercontent.com`).  
**Deprecation deadline carried in every PR:** the legacy wire dies **2027-07-28**.

## 1. Selection

From `MCP_WIRE_CENSUS_GITHUB_2026-10-07.jsonl` (516 rows): `migration == "header-add"`, `fork == false`,
minus the 10 wave-1 repos, sorted by `updated` descending -> **412 eligible rows**, top **25** taken.
All 25 are census `era: unknown / class: header-add`. The unknown-era fallback in the plan was not
needed (412 > 25). Remaining eligible for batch 2+: **387**.

Every one of the 25 exists, none archived, none a fork -> **0 skips**.

## 2. Results

| # | repo | PR | census era/class | before (local audit) | after (verify) | control | files changed | notes |
|--:|---|---|---|---|---|---|---|---|
| 1 | `dora-nis2-crosswalk-mcp` | https://github.com/CSOAI-ORG/dora-nis2-crosswalk-mcp/pull/2 (PR #2) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `pyproject.toml`, `server.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; stdio-only: headers N/A at runtime; `http_app()` enable path + note; before-era comes from `.well-known/agent-card.json` `"mcp_name"` token (scanner false-positive class), not wire code; branch carries 10 commits (2 interrupted runs re-PUT identical content); no force-push allowed, diff is 4 files; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 2 | `watermarking-authenticity-mcp` | https://github.com/CSOAI-ORG/watermarking-authenticity-mcp/pull/15 (PR #15) | unknown / header-add | 2025-11 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry identified: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files (wrapper included); read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 5 |
| 3 | `uk-ai-bill-compliance-mcp` | https://github.com/CSOAI-ORG/uk-ai-bill-compliance-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `pyproject.toml`, `server.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; stdio-only: headers N/A at runtime; `http_app()` enable path + note; before-era comes from `.well-known/agent-card.json` `"mcp_name"` token (scanner false-positive class), not wire code; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 4 | `tax-bridge-mcp` | https://github.com/CSOAI-ORG/tax-bridge-mcp/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 4: `pyproject.toml`, `server.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; stdio-only: headers N/A at runtime; `http_app()` enable path + note; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 5 | `slsa-supply-chain-mcp` | https://github.com/CSOAI-ORG/slsa-supply-chain-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `pyproject.toml`, `server.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; stdio-only: headers N/A at runtime; `http_app()` enable path + note; before-era comes from `.well-known/agent-card.json` `"mcp_name"` token (scanner false-positive class), not wire code; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 6 | `sip-bridge-mcp` | https://github.com/CSOAI-ORG/sip-bridge-mcp/pull/8 (PR #8) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 4: `pyproject.toml`, `server.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; stdio-only: headers N/A at runtime; `http_app()` enable path + note; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 7 | `sigstore-cosign-mcp` | https://github.com/CSOAI-ORG/sigstore-cosign-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `pyproject.toml`, `server.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; stdio-only: headers N/A at runtime; `http_app()` enable path + note; before-era comes from `.well-known/agent-card.json` `"mcp_name"` token (scanner false-positive class), not wire code; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 8 | `scada-bridge-mcp` | https://github.com/CSOAI-ORG/scada-bridge-mcp/pull/7 (PR #7) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 4: `pyproject.toml`, `server.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; stdio-only: headers N/A at runtime; `http_app()` enable path + note; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 9 | `sbom-cyclonedx-mcp` | https://github.com/CSOAI-ORG/sbom-cyclonedx-mcp/pull/8 (PR #8) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `pyproject.toml`, `server.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; stdio-only: headers N/A at runtime; `http_app()` enable path + note; before-era comes from `.well-known/agent-card.json` `"mcp_name"` token (scanner false-positive class), not wire code; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 10 | `sap-bridge-mcp` | https://github.com/CSOAI-ORG/sap-bridge-mcp/pull/8 (PR #8) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 4: `pyproject.toml`, `server.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; stdio-only: headers N/A at runtime; `http_app()` enable path + note; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 11 | `oracle-bridge-mcp` | https://github.com/CSOAI-ORG/oracle-bridge-mcp/pull/7 (PR #7) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 4: `pyproject.toml`, `server.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; stdio-only: headers N/A at runtime; `http_app()` enable path + note; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 12 | `nist-iso42001-crosswalk-mcp` | https://github.com/CSOAI-ORG/nist-iso42001-crosswalk-mcp/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 4: `pyproject.toml`, `server.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.2.0"` -> `"mcp>=2.0.0"`; stdio-only: headers N/A at runtime; `http_app()` enable path + note; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 13 | `nacha-bridge-mcp` | https://github.com/CSOAI-ORG/nacha-bridge-mcp/pull/7 (PR #7) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 4: `pyproject.toml`, `server.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; stdio-only: headers N/A at runtime; `http_app()` enable path + note; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 14 | `mqtt-bridge-mcp` | https://github.com/CSOAI-ORG/mqtt-bridge-mcp/pull/7 (PR #7) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 4: `pyproject.toml`, `server.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; stdio-only: headers N/A at runtime; `http_app()` enable path + note; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 15 | `model-scoreboard-mcp` | https://github.com/CSOAI-ORG/model-scoreboard-mcp/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 4: `pyproject.toml`, `server.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; stdio-only: headers N/A at runtime; `http_app()` enable path + note; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 16 | `mismo-bridge-mcp` | https://github.com/CSOAI-ORG/mismo-bridge-mcp/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 4: `pyproject.toml`, `server.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; stdio-only: headers N/A at runtime; `http_app()` enable path + note; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 17 | `mica-crypto-mcp` | https://github.com/CSOAI-ORG/mica-crypto-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `pyproject.toml`, `server.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; stdio-only: headers N/A at runtime; `http_app()` enable path + note; before-era comes from `.well-known/agent-card.json` `"mcp_name"` token (scanner false-positive class), not wire code; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 18 | `ll144-bias-audit-mcp` | https://github.com/CSOAI-ORG/ll144-bias-audit-mcp/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 4: `pyproject.toml`, `server.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.2.0"` -> `"mcp>=2.0.0"`; stdio-only: headers N/A at runtime; `http_app()` enable path + note; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 19 | `iso8583-bridge-mcp` | https://github.com/CSOAI-ORG/iso8583-bridge-mcp/pull/7 (PR #7) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 4: `pyproject.toml`, `server.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; stdio-only: headers N/A at runtime; `http_app()` enable path + note; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 20 | `iso20022-bridge-mcp` | https://github.com/CSOAI-ORG/iso20022-bridge-mcp/pull/7 (PR #7) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 4: `pyproject.toml`, `server.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; stdio-only: headers N/A at runtime; `http_app()` enable path + note; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 21 | `hl7-fhir-bridge-mcp` | https://github.com/CSOAI-ORG/hl7-fhir-bridge-mcp/pull/7 (PR #7) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 4: `pyproject.toml`, `server.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; stdio-only: headers N/A at runtime; `http_app()` enable path + note; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 22 | `gs1-bridge-mcp` | https://github.com/CSOAI-ORG/gs1-bridge-mcp/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 4: `pyproject.toml`, `server.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; stdio-only: headers N/A at runtime; `http_app()` enable path + note; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 23 | `fix-bridge-mcp` | https://github.com/CSOAI-ORG/fix-bridge-mcp/pull/7 (PR #7) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 4: `pyproject.toml`, `server.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; stdio-only: headers N/A at runtime; `http_app()` enable path + note; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 24 | `edi-bridge-mcp` | https://github.com/CSOAI-ORG/edi-bridge-mcp/pull/7 (PR #7) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 4: `pyproject.toml`, `server.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; stdio-only: headers N/A at runtime; `http_app()` enable path + note; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 25 | `dlms-bridge-mcp` | https://github.com/CSOAI-ORG/dlms-bridge-mcp/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 4: `pyproject.toml`, `server.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; stdio-only: headers N/A at runtime; `http_app()` enable path + note; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |

Every PR body carries: class `header-add`, the runbook steps applied, the verify command
`PYTHONPATH= /opt/homebrew/bin/python3.11 ~/clawd/mcp_wire_audit.py audit --local <repo>`, the
before/after/control table, the line **"After-rows are note-text-driven until post-merge re-audit"**,
a link to `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md` and the 2027-07-28 deprecation deadline.

## 3. What the runbook produced per repo

This batch is one generated family, so the diff is near-identical 25 times:

* **`pyproject.toml` (25/25):** an mcp dependency line existed everywhere -> `"mcp>=1.0.0"` (23 repos)
  or `"mcp>=1.2.0"` (2 repos) -> `"mcp>=2.0.0"`; the packaging include list gained the shim
  (`only-include += "mcp2026_shim.py"` on 23, `py-modules += "mcp2026_shim"` on 2) so the vendored
  module ships in the wheel. No pin was invented anywhere - every repo had a real line to pin.
* **`server.py` (25/25):** `from mcp.server.fastmcp import FastMCP` ->
  `from mcp.server.mcpserver import MCPServer as FastMCP` (forced companion rename: `mcp.server.fastmcp`
  raises `ModuleNotFoundError` by design in mcp 2.x, so the pin would not import without it), plus the
  migration-note block.
* **`mcp2026_shim.py` (25/25):** vendored at the repo root (665 lines, stdlib, zero third-party deps).
* **stdio (24):** no HTTP entry point was identifiable, so `headers N/A at runtime; HTTP via ShimASGI
  when exposed` - the note says exactly that and `server.py` gained the `http_app()` enable path
  (`ShimASGI(mcp.streamable_http_app(json_response=True))`), matching wave 1's stdio repos.
* **HTTP (1 - `watermarking-authenticity-mcp`):** `mcp-wrapper.py` runs
  `transport="streamable-http"` -> the ingress is really wired: `ShimASGI(...)` wraps
  `mcp_server.streamable_http_app(json_response=True)` in `__main__`, and the in-code served
  declarations (`protocolVersion` / `mcp_version`) moved 2025-11-25 -> 2026-07-28. That is
  5 changed files; the other 24 PRs are 4.
* **`MIGRATION_NOTE.md` (25/25):** class, transport reality, steps applied, verify command with the
  before/after/control rows, the honesty paragraph, and follow-ups.
* **JS:** no JS server in this batch. `watermarking-authenticity-mcp` carries a `package.json`, but it
  has no `dependencies` key (metadata only) and the server is Python - **no JS pin was invented**,
  per the wave-1 rule that no `@modelcontextprotocol/sdk` release speaks 2026-07-28.

## 4. Verification receipts

Local audits ran against a fully reconstructed tree per repo (every scannable file in the default
branch's `git/trees` listing, fetched via `raw.githubusercontent.com`), before patching, after
patching, and with the migration-note block deleted (control):

| state | repos | reading |
|---|---|---|
| before | 6 | `2026-07 / header-add` - the `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (registry token, known false-positive class), **not** wire code |
| before | 1 | `2025-11 / header-add` (`watermarking-authenticity-mcp`) |
| before | 18 | `unknown / header-add` |
| **after (this branch)** | **25** | **`2026-07 / handshake-removal`** |
| control (note block removed) | 25 | `2026-07 / header-add` (6) or `unknown / header-add` (19) - `session-id` disappears, which is the provenance proof |

Read the `after` column honestly: the audit tool excludes its own shim (`SELF_FILES`) and does not
scan `.md`, so the new `protocol-2026-07-28` / `mcp-method-header` / `mcp-name-header` /
`server-discover` signals are read from the migration-note text in the entry file, and `session-id`
is prose about the shim *stripping* that header - not session code. Runtime evidence for the wire is
the `mcp>=2.0.0` pin (2.3.0 speaks 2026-07-28) plus the shim at the ingress; `mcp>=2.0.0` alone is
not a wire signal for this scanner. **After-rows are note-text-driven until post-merge re-audit.**

* **CI sampled on 4 PRs (all green where checks exist):** `tax-bridge-mcp` test pass,
  `nist-iso42001-crosswalk-mcp` test pass, `dora-nis2-crosswalk-mcp` `test (3.11)` pass,
  `watermarking-authenticity-mcp` CodeQL pass + `Analyze (python)` pass - the pin and the
  `FastMCP -> MCPServer` rename import and run under mcp 2.x.
* **PR read-back after creation (all 25):** `state: open`, `base: main`, head
  `mcp-2026-wire-header-add`, `changed_files` 4 (24 repos) or 5 (`watermarking-authenticity-mcp`).
* **Default branches untouched (sampled 3):** `GET contents/MIGRATION_NOTE.md?ref=main` -> 404 on
  `tax-bridge-mcp`, `watermarking-authenticity-mcp`, `dlms-bridge-mcp`. No push, no force, no merge
  was made by this lane; every write went through `PUT contents` / `POST git/refs` / `POST pulls`
  on the `mcp-2026-wire-header-add` branch only.

## 5. API budget and rate discipline

* **454 `gh api` calls** against the 500 hard cap: 50 discovery (25 repo meta + 25 recursive trees),
  150 in the first push attempt (a `--input -` flag was missing, so every branch POST 422'd and the
  retry loop burned 5 calls per repo - fixed before any PR existed), 7 in the interrupted second
  attempt, 227 in the successful third pass, 7 to finish `dora-nis2-crosswalk-mcp`, 4 content/PR
  read-backs, 5 CI/diff checks. Rate-limit probes (`gh api rate_limit`, which does not count against
  the core quota) read 5000/5000 at start.
* 0.25 s pacing between calls, 30 s exponential backoff armed for secondary limits: **0
  secondary-limit hits**. Deterministic HTTP 4xx are not retried (that policy change is what capped
  the budget).
* **Wall time: ~26 minutes** (00:54 UTC selection -> 01:20 UTC report), well inside the 90-minute
  budget.

## 6. Known gaps carried forward

* **`dora-nis2-crosswalk-mcp` (PR #2) has 10 commits on its branch** - the interrupted second pass
  re-PUT identical content before the crash. The PR diff is the correct 4 files and `changed_files`
  reads 4; no history rewrite was done because force-push is forbidden by this lane's rules.
* The `after` audit rows are note-text-driven (section 4): re-audit after merge and after a live
  probe (plan section 6.5) before anyone quotes `migration: none`.
* Static declaration surfaces (`.well-known/*.json`, `server.json`, `manifest.json`, `README.md`)
  still declare older wires - listed as follow-ups in each `MIGRATION_NOTE.md`, not silent-edited
  (Art. 21: a declaration change gets its own commit).
* The before-era `2026-07` on 6 repos is the `.well-known/agent-card.json` `"mcp_name"` token, a
  scanner false-positive: those repos are **not** evidence of 2026-07-28 wire support before this
  branch. The census row (`unknown / header-add`) is the honest pre-state.
* Batch 2: the next 25 of the 387 remaining eligible `header-add` non-fork rows, same pattern.
* No git commit in `~/clawd` from this lane - the parent lane commits this report.

## 7. Artifacts

* `MCP_HEADER_ADD_WAVE2_BATCH1_2026-10-08.md` - this report.
* Per repo, on `mcp-2026-wire-header-add`: `mcp2026_shim.py`, `MIGRATION_NOTE.md`, pinned
  `pyproject.toml`, edited `server.py` (+ `mcp-wrapper.py` on `watermarking-authenticity-mcp`).
* Scratch (pruned after 24 h): `~/.hermes/cache/scratch/wave2_{discover,patch,audit,note,push}.py`,
  `wave2_{sel,discovery,rows,patch,audits,push}.json`, `push.log`, `wave2_table.md`.
