# MCP header-add migration wave 2, batch 4 (25 PRs)

**Date:** 2026-10-08 - **Lane:** M4 MCP-migration (wave 2, batch 4 of the auto-rolling sequence) - **Status:** complete, 25/25 PRs open
**Runbook:** `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md` section 3 (header-add) + section 4 (the shim as bridge)
**Pattern proven by:** `MCP_HEADER_ADD_WAVE1_2026-10-07.md` (10/10) and `MCP_HEADER_ADD_WAVE2_BATCH1_2026-10-08.md` (25/25) - same branch name, same steps, same verify.
**Scope:** CSOAI-ORG repos only, branch `mcp-2026-wire-header-add`, base = each repo's default branch, no default-branch pushes, no force, no clones (reads via `gh api` + `raw.githubusercontent.com`).
**Deprecation deadline carried in every PR:** the legacy wire dies **2027-07-28**.

## 1. Selection

The slice was handed to this lane pre-cut: `/Users/nicholas/.hermes/cache/scratch/mig-batch4-slice.json` - **25 unique repo names**, all 25 present in `MCP_WIRE_CENSUS_GITHUB_2026-10-07.jsonl` (516 rows) as `migration == "header-add"`, `fork == false`, census era `unknown`.
No repo was substituted, no other slice's pool was touched.

**Skips: 0.** All 25 exist, none archived, none a fork, none 404 (discovery: 25/25 `status: ready`).

## 2. Results

| # | repo | PR | census era/class | before (local audit) | after (verify) | control | files changed | notes |
|--:|---|---|---|---|---|---|---|---|
| 1 | `evergame-hive-mcp` | https://github.com/CSOAI-ORG/evergame-hive-mcp/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2: `MIGRATION_NOTE.md`, `mcp2026_shim.py` | **package.json-only (TypeScript)**: no `pyproject.toml`, no `server.py`; real dep `"@modelcontextprotocol/sdk": "^1.15.0"` left untouched - **no JS pin invented** (no JS SDK release speaks 2026-07-28); vendored shim + honest `MIGRATION_NOTE.md` only; after == before == control by design; 2 files; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 2 |
| 2 | `firmware-attestation-mcp` | https://github.com/CSOAI-ORG/firmware-attestation-mcp/pull/2 (PR #2) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.2.0"` -> `"mcp>=2.0.0"`; FastMCP -> MCPServer import rename; stdio-only: `headers N/A at runtime` + `http_app()` enable path; before-era `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (scanner false-positive class); read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 3 | `fsa-food-safety-mcp` | https://github.com/CSOAI-ORG/fsa-food-safety-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; FastMCP -> MCPServer import rename; stdio-only: `headers N/A at runtime` + `http_app()` enable path; before-era `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (scanner false-positive class); read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 4 | `iso-42005-impact-mcp` | https://github.com/CSOAI-ORG/iso-42005-impact-mcp/pull/7 (PR #7) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp[cli]>=1.3.0"` -> `"mcp[cli]>=2.0.0"`; FastMCP -> MCPServer import rename; stdio-only: `headers N/A at runtime` + `http_app()` enable path; before-era `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (scanner false-positive class); read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 5 | `meok-allmi-hiab-mcp` | https://github.com/CSOAI-ORG/meok-allmi-hiab-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp[cli]>=1.3.0"` -> `"mcp[cli]>=2.0.0"`; FastMCP -> MCPServer import rename; stdio-only: `headers N/A at runtime` + `http_app()` enable path; before-era `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (scanner false-positive class); read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 6 | `meok-bs7121-mcp` | https://github.com/CSOAI-ORG/meok-bs7121-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp[cli]>=1.3.0"` -> `"mcp[cli]>=2.0.0"`; FastMCP -> MCPServer import rename; stdio-only: `headers N/A at runtime` + `http_app()` enable path; before-era `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (scanner false-positive class); read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 7 | `meok-cold-chain-pharma-mcp` | https://github.com/CSOAI-ORG/meok-cold-chain-pharma-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp[cli]>=1.3.0"` -> `"mcp[cli]>=2.0.0"`; FastMCP -> MCPServer import rename; stdio-only: `headers N/A at runtime` + `http_app()` enable path; before-era `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (scanner false-positive class); read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 8 | `meok-cpa-contract-lift-mcp` | https://github.com/CSOAI-ORG/meok-cpa-contract-lift-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp[cli]>=1.3.0"` -> `"mcp[cli]>=2.0.0"`; FastMCP -> MCPServer import rename; stdio-only: `headers N/A at runtime` + `http_app()` enable path; before-era `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (scanner false-positive class); read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 9 | `csoai-cra-art14-reporter-mcp` | https://github.com/CSOAI-ORG/csoai-cra-art14-reporter-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp[cli]>=1.3.0"` -> `"mcp[cli]>=2.0.0"`; FastMCP -> MCPServer import rename; stdio-only: `headers N/A at runtime` + `http_app()` enable path; before-era `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (scanner false-positive class); **pre-existing PR**, opened **2026-10-08 01:04 UTC** by an earlier run of this same migration pattern (same branch, same class, different title/body template; not claimed by batch-1 or by the parallel batch2-4 report): branch content byte-identical to this run, PR body re-PATCHed to the batch-4 template (before/after/control rows + honesty line), Cursor summary block preserved; 6 commits, no force; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 10 | `meok-dvsa-olicence-mcp` | https://github.com/CSOAI-ORG/meok-dvsa-olicence-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp[cli]>=1.3.0"` -> `"mcp[cli]>=2.0.0"`; FastMCP -> MCPServer import rename; stdio-only: `headers N/A at runtime` + `http_app()` enable path; before-era `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (scanner false-positive class); read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 11 | `csoai-eu-ai-act-art-13-ifu-mcp` | https://github.com/CSOAI-ORG/csoai-eu-ai-act-art-13-ifu-mcp/pull/7 (PR #7) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp[cli]>=1.3.0"` -> `"mcp[cli]>=2.0.0"`; FastMCP -> MCPServer import rename; stdio-only: `headers N/A at runtime` + `http_app()` enable path; before-era `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (scanner false-positive class); **pre-existing PR**, opened **2026-10-08 01:04 UTC** by an earlier run of this same migration pattern (same branch, same class, different title/body template; not claimed by batch-1 or by the parallel batch2-4 report): branch content byte-identical to this run, PR body re-PATCHed to the batch-4 template (before/after/control rows + honesty line), Cursor summary block preserved; 6 commits, no force; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 12 | `meok-eu-mobility-package-mcp` | https://github.com/CSOAI-ORG/meok-eu-mobility-package-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp[cli]>=1.3.0"` -> `"mcp[cli]>=2.0.0"`; FastMCP -> MCPServer import rename; stdio-only: `headers N/A at runtime` + `http_app()` enable path; before-era `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (scanner false-positive class); read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 13 | `meok-eu-platform-worker-mcp` | https://github.com/CSOAI-ORG/meok-eu-platform-worker-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp[cli]>=1.3.0"` -> `"mcp[cli]>=2.0.0"`; FastMCP -> MCPServer import rename; stdio-only: `headers N/A at runtime` + `http_app()` enable path; before-era `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (scanner false-positive class); read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 14 | `meok-ev-recall-transport-mcp` | https://github.com/CSOAI-ORG/meok-ev-recall-transport-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp[cli]>=1.3.0"` -> `"mcp[cli]>=2.0.0"`; FastMCP -> MCPServer import rename; stdio-only: `headers N/A at runtime` + `http_app()` enable path; before-era `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (scanner false-positive class); read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 15 | `meok-fmcsa-hours-of-service-mcp` | https://github.com/CSOAI-ORG/meok-fmcsa-hours-of-service-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp[cli]>=1.3.0"` -> `"mcp[cli]>=2.0.0"`; FastMCP -> MCPServer import rename; stdio-only: `headers N/A at runtime` + `http_app()` enable path; before-era `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (scanner false-positive class); read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 16 | `meok-fors-clocs-mcp` | https://github.com/CSOAI-ORG/meok-fors-clocs-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp[cli]>=1.3.0"` -> `"mcp[cli]>=2.0.0"`; FastMCP -> MCPServer import rename; stdio-only: `headers N/A at runtime` + `http_app()` enable path; before-era `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (scanner false-positive class); read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 17 | `meok-iata-dgr-air-cargo-mcp` | https://github.com/CSOAI-ORG/meok-iata-dgr-air-cargo-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp[cli]>=1.3.0"` -> `"mcp[cli]>=2.0.0"`; FastMCP -> MCPServer import rename; stdio-only: `headers N/A at runtime` + `http_app()` enable path; before-era `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (scanner false-positive class); read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 18 | `meok-imo-marpol-marine-mcp` | https://github.com/CSOAI-ORG/meok-imo-marpol-marine-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp[cli]>=1.3.0"` -> `"mcp[cli]>=2.0.0"`; FastMCP -> MCPServer import rename; stdio-only: `headers N/A at runtime` + `http_app()` enable path; before-era `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (scanner false-positive class); read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 19 | `meok-iru-tir-international-mcp` | https://github.com/CSOAI-ORG/meok-iru-tir-international-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp[cli]>=1.3.0"` -> `"mcp[cli]>=2.0.0"`; FastMCP -> MCPServer import rename; stdio-only: `headers N/A at runtime` + `http_app()` enable path; before-era `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (scanner false-positive class); read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 20 | `meok-law-mcp` | https://github.com/CSOAI-ORG/meok-law-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; FastMCP -> MCPServer import rename; stdio-only: `headers N/A at runtime` + `http_app()` enable path; before-era `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (scanner false-positive class); read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 21 | `meok-livestock-welfare-transport-mcp` | https://github.com/CSOAI-ORG/meok-livestock-welfare-transport-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp[cli]>=1.3.0"` -> `"mcp[cli]>=2.0.0"`; FastMCP -> MCPServer import rename; stdio-only: `headers N/A at runtime` + `http_app()` enable path; before-era `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (scanner false-positive class); read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 22 | `meok-nhvr-australia-mcp` | https://github.com/CSOAI-ORG/meok-nhvr-australia-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp[cli]>=1.3.0"` -> `"mcp[cli]>=2.0.0"`; FastMCP -> MCPServer import rename; stdio-only: `headers N/A at runtime` + `http_app()` enable path; before-era `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (scanner false-positive class); read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 23 | `meok-rail-freight-uk-mcp` | https://github.com/CSOAI-ORG/meok-rail-freight-uk-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp[cli]>=1.3.0"` -> `"mcp[cli]>=2.0.0"`; FastMCP -> MCPServer import rename; stdio-only: `headers N/A at runtime` + `http_app()` enable path; before-era `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (scanner false-positive class); read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 24 | `meok-tacho-audit-mcp` | https://github.com/CSOAI-ORG/meok-tacho-audit-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp[cli]>=1.3.0"` -> `"mcp[cli]>=2.0.0"`; FastMCP -> MCPServer import rename; stdio-only: `headers N/A at runtime` + `http_app()` enable path; before-era `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (scanner false-positive class); read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 25 | `meok-transport-canada-hos-mcp` | https://github.com/CSOAI-ORG/meok-transport-canada-hos-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp[cli]>=1.3.0"` -> `"mcp[cli]>=2.0.0"`; FastMCP -> MCPServer import rename; stdio-only: `headers N/A at runtime` + `http_app()` enable path; before-era `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (scanner false-positive class); read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |

Every PR body carries: class `header-add`, the runbook steps applied, the verify command
`PYTHONPATH= /opt/homebrew/bin/python3.11 ~/clawd/mcp_wire_audit.py audit --local <repo>`, the
before/after/control table, the line **"After-rows are note-text-driven until post-merge re-audit"**,
a link to `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md` and the 2027-07-28 deprecation deadline.
All 25 bodies were re-read after creation and checked for all six elements: **25/25 pass**.

## 3. What the runbook produced per repo

This batch is one generated family (24 Python + 1 TypeScript), so the diff is near-identical:

* **`pyproject.toml` (24/24 Python repos):** a real mcp dependency line existed everywhere ->
  `"mcp[cli]>=1.3.0"` (21 repos), `"mcp>=1.0.0"` (2 repos), `"mcp>=1.2.0"` (1 repo) ->
  `mcp...>=2.0.0` (extras preserved, e.g. `mcp[cli]>=2.0.0`). **No pin was invented anywhere.**
  The packaging include list gained the shim: `py-modules += "mcp2026_shim"` (21),
  `only-include += "mcp2026_shim.py"` (2), `include += "mcp2026_shim.py"` (1) - so the vendored
  module ships in the wheel.
* **`server.py` (24/24):** `from mcp.server.fastmcp import FastMCP` ->
  `from mcp.server.mcpserver import MCPServer as FastMCP` (forced companion rename: in mcp 2.x
  `mcp.server.fastmcp` raises `ModuleNotFoundError` by design, so the pin would not import without
  it), plus the migration-note block anchored on `^def main(` - 18 of the 24 declare
  `def main() -> None:`, so the batch-1 anchor `def main():` had to be widened; without that the
  note would have silently landed nowhere on those 18 repos (the other 6 use plain `def main():`).
* **`mcp2026_shim.py` (25/25):** vendored at the repo root (665 lines, stdlib, zero third-party
  deps).
* **stdio (24):** no HTTP/ASGI/WSGI entry point exists in any of them (no `mcp-wrapper.py`, and no
  `uvicorn` / `streamable_http_app` / `.sse_app(` in any code file), so `headers N/A at runtime;
  HTTP via ShimASGI when exposed` and `server.py` gained the `http_app()` enable path
  (`ShimASGI(mcp.streamable_http_app(json_response=True))`).
* **`MIGRATION_NOTE.md` (25/25):** class, transport reality, steps applied, verify command with
  the before/after/control rows, the honesty paragraph, and follow-ups.
* **`evergame-hive-mcp` (1 - the JS exception):** `package.json`-only TypeScript server
  (`src/index.ts`), **no `pyproject.toml` and no `server.py`**. The real dependency
  `"@modelcontextprotocol/sdk": "^1.15.0"` was **left untouched** - no JS SDK release speaks
  2026-07-28, and this lane does not invent JS pins. No note-comment block was added to
  `src/index.ts` either (the vendored shim is Python and cannot run inside a Node process; plan
  section 4 places it at the ingress). The PR ships exactly 2 files - `mcp2026_shim.py` + an honest
  `MIGRATION_NOTE.md` - and its body states plainly that **this PR is not evidence the server
  speaks 2026-07-28**.
* **HTTP wrapper:** none in this batch - `mcp-wrapper.py` does not exist in any of the 25.

## 4. Verification receipts

Local audits ran against a fully reconstructed tree per repo (every scannable file in the default
branch's `git/trees` listing, fetched via `raw.githubusercontent.com`), before patching, after
patching, and with the migration-note block deleted (control):

| state | repos | reading |
|---|---|---|
| before | 24 | `2026-07 / header-add` - the `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (registry token, known false-positive class), **not** wire code |
| before | 1 | `unknown / header-add` (`evergame-hive-mcp`) |
| **after (this branch)** | **24** | **`2026-07 / handshake-removal`** |
| after | 1 | `unknown / header-add` (`evergame-hive-mcp`) - unchanged by design, no code/manifest change was permissible |
| control (note block removed) | 24 | `2026-07 / header-add` - `session-id` disappears, which is the provenance proof |
| control | 1 | `unknown / header-add` (`evergame-hive-mcp`) |

* **`py_compile` on all 24 patched `server.py` files: 24/24 OK** (batch 1 did not compile-check;
  added here because the note-block anchor was widened).
* Read the `after` column honestly: the audit tool excludes its own shim (`SELF_FILES`) and does not
  scan `.md`, so the new `protocol-2026-07-28` / `mcp-method-header` / `mcp-name-header` /
  `server-discover` signals are read from the migration-note text in the entry file, and `session-id`
  is prose about the shim *stripping* that header - not session code. Runtime evidence for the wire
  is the `mcp>=2.0.0` pin (2.3.0 speaks 2026-07-28) plus the shim at the ingress; `mcp>=2.0.0` alone
  is not a wire signal for this scanner. **After-rows are note-text-driven until post-merge re-audit.**
* **CI sampled on 3 PRs (green where checks exist):** `iso-42005-impact-mcp` `test (3.11)` pass +
  `test (3.10)` pass, `meok-law-mcp` `build` pass, `evergame-hive-mcp` Cursor Approval Agent +
  Security Agent pass - the pin and the `FastMCP -> MCPServer` rename import and run under mcp 2.x.
* **PR read-back after creation (all 25):** `state: open`, `base: main`, head
  `mcp-2026-wire-header-add`, `changed_files` 4 (24 repos) or 2 (`evergame-hive-mcp`).
* **Creation timestamps (all 25 read back):** 23 PRs were created by this run between
  `2026-10-08T02:26:47Z` and `02:30:41Z` with this lane's title; the remaining 2 carry
  `01:04:00Z` / `01:04:11Z` and a different title (section 6).
* **Org-wide search (1 call, search quota not core):**
  `search/issues?q=org:CSOAI-ORG+is:pr+is:open+head:mcp-2026-wire-header-add` ->
  `total_count: 203`, and all **25/25** of this slice are in that result set.
* **Default branches untouched (sampled 3):** `GET contents/MIGRATION_NOTE.md?ref=main` -> 404 on
  `meok-law-mcp`, `evergame-hive-mcp`, `meok-tacho-audit-mcp`. No push, no force, no merge was made
  by this lane; every write went through `PUT contents` / `POST git/refs` / `POST pulls` (plus one
  `PATCH pulls/<n>` body edit) on the `mcp-2026-wire-header-add` branch only.

## 5. API budget and rate discipline

* **372 core-quota `gh api` calls** against the 600 hard cap: 50 discovery (25 repo meta +
  25 recursive trees), 240 in the push/PR pass (23 new PRs), 2 repo PR listings + 4 pull/file
  reads + 10 branch/content reads while diagnosing the 2 pre-existing PRs, 4 `PATCH pulls/<n>` +
  read-back, 28 final read-back (25 pulls + 3 default-branch probes), 9 CI/file-shape checks,
  25 `created_at` read-backs. Plus 1 org-wide search call on the **search** quota (separate
  budget) and 2 failed `gh search` invocations that never reached the core quota. Rate-limit
  probes (`gh api rate_limit`, which does not count against the core quota) read **5000/5000** at
  start.
* 0.30 s pacing between calls, 30 s exponential backoff armed for secondary limits:
  **0 secondary-limit hits**. Deterministic HTTP 4xx are not retried - that policy is what produced
  the two `422 already exists` results below instead of a retry storm.
* **Wall time: ~26 minutes** (02:14 UTC slice confirmed -> 02:40 UTC report finalised), well
  inside the 90-minute budget.

## 6. Known gaps and incidents

* **2 of the 25 PRs already existed when this run reached them** - `csoai-cra-art14-reporter-mcp#1`
  (`created_at 2026-10-08T01:04:00Z`) and `csoai-eu-ai-act-art-13-ifu-mcp#7`
  (`2026-10-08T01:04:11Z`), same branch and same class but a different title/body template
  ("MCP 2026-07-28: stateless-wire header-add migration"). **No report in `~/clawd` claims them**
  (not batch 1, not the parallel batch2-4 report), so their origin is unattributed - an earlier run
  of this same migration pattern is the only thing that fits. GitHub answered
  `422 A pull request already exists for CSOAI-ORG:mcp-2026-wire-header-add`. Handling: the branch
  content on both was read back and is **byte-identical** to this run's intended content (all 4
  files match the local patched tree), so nothing was re-pushed and no history was rewritten; both
  PR **bodies were `PATCH`ed to the batch-4 template** - they were missing the before/after/control
  rows and claimed "Files changed (2)" for a 4-file branch - with the Cursor Bugbot summary block
  preserved, then re-read: `state open`, `base main`, `head mcp-2026-wire-header-add`,
  `changed_files 4`, rows table + honesty line present. They carry 6 commits each - still no
  force-push, still PR-only.
* **Cross-lane overlap (parent should de-duplicate).** A parallel M4 lane committed
  `MCP_HEADER_ADD_WAVE2_BATCH2-4_2026-10-08.md` (commit `7d5626793`, watch-check 02:35 UTC). Its
  section-3 table of 36 rows includes **23 of this batch's 25 PR URLs**, under a combined
  "35 new PRs" heading, with an explicit `Sibling M4 in parallel window ... +22 (cross-fire)` row.
  Those 23 were created by **this** lane between `02:26:47Z` and `02:30:41Z`, every one with title
  `MCP 2026-07-28 wire: header-add (SDK pin + vendored shim + MIGRATION_NOTE)` - the `created_at`
  read-back of all 25 PRs (scratch `wave4b_created.json`) is the evidence, and that lane's own
  label concedes the sibling attribution. Two numbers do not line up and the parent should settle
  them before anything is published: (a) its `+22` sibling row vs this lane's **23** creations;
  (b) an org-wide
  `search/issues?q=org:CSOAI-ORG+is:pr+is:open+head:mcp-2026-wire-header-add` returns
  **`total_count: 203`** open PRs (all 25 of this slice present), while that report's
  `168 already-migrated + 35 new` also totals 203 - consistent only if the sibling count is 22.
  Art. 21: measurement before claim.
* All 25 PRs are **open, not merged**; the `after` rows are note-text-driven (section 4): re-audit
  after merge and after a live probe (plan section 6.5) before anyone quotes `migration: none`.
* `evergame-hive-mcp` **cannot** move class with this PR: it is the one repo where the honest
  answer is "blocked on an upstream JS SDK release". Its after row is deliberately identical to its
  before row; a reviewer must not read that PR as 2026-07-28 support.
* Static declaration surfaces (`.well-known/*.json`, `server.json`, `smithery.yaml`, `README.md`)
  still declare older wires - listed as follow-ups in each `MIGRATION_NOTE.md`, not silent-edited
  (Art. 21: a declaration change gets its own commit). Three repos (`iso-42005-impact-mcp`,
  `csoai-cra-art14-reporter-mcp`, `csoai-eu-ai-act-art-13-ifu-mcp`) additionally declare a
  `streamable-http` remote inside `server.json` - untouched here.
* The before-era `2026-07` on 24 repos is the `.well-known/agent-card.json` `"mcp_name"` token, a
  scanner false-positive: those repos are **not** evidence of 2026-07-28 wire support before this
  branch. The census row (`unknown / header-add`) is the honest pre-state.
* Batch 5: the next 25 from `mig-remaining-all.json` (387 rows at slice time, minus this batch's
  25 = 362 on paper). The parallel M4 lane has been drawing from the same pool, so re-derive the
  remainder and re-claim before a batch-5 slice is cut - the batch2-4 report already accounts for
  13 more and asserts 168 already-migrated.
* No git commit in `~/clawd` from this lane - the parent lane commits this report.

## 7. Artifacts

* `MCP_HEADER_ADD_WAVE2_BATCH4_2026-10-08.md` - this report.
* Per repo, on `mcp-2026-wire-header-add`: `mcp2026_shim.py`, `MIGRATION_NOTE.md`, pinned
  `pyproject.toml`, edited `server.py` (2 files only on `evergame-hive-mcp`).
* Scratch (pruned after 24 h): `~/.hermes/cache/scratch/wave4b_discover.py`,
  `wave4b_before.py`, `wave4b_patch.py`, `wave4b_audit.py`, `wave4b_note.py`, `wave4b_push.py`,
  `wave4b_discovery.json`, `wave4b_before.json`, `wave4b_patch.json`, `wave4b_audits.json`,
  `wave4b_push.json`, `wave4b_readback.json`, `wave4b_rows.json`,
  `wave4b_preexisting_prs.json`, `wave4b_bodypatch.json`, `wave4b_created.json`,
  `wave4b_orgsearch.json`, `wave4b_table.md`.
* `/tmp/mig4b/` reconstructed trees - **removed at the end of this lane** (disk is tight).

---

Totals: **25 slice repos -> 0 skips, 25 open PRs** (23 created by this run 02:26:47-02:30:41Z,
2 pre-existing from 01:04Z and body-corrected). API **372/600** core + 1 search-quota call.
Wall **~26 min** (02:14-02:40 UTC). 0 secondary-rate-limit hits, 0 default-branch writes,
0 force pushes, 0 invented pins.
