# MCP header-add migration wave 2, batch 6 (25 PRs)

**Date:** 2026-10-08 - **Lane:** M4 MCP-migration (wave 2, batch 6 of the auto-rolling sequence) - **Status:** complete, 25/25 PRs open
**Runbook:** `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md` section 3 (header-add) + section 4 (the shim as bridge)
**Pattern proven by:** `MCP_HEADER_ADD_WAVE1_2026-10-07.md` (10/10) and `MCP_HEADER_ADD_WAVE2_BATCH1_2026-10-08.md` (25/25) - same branch name, same steps, same verify.
**Scope:** CSOAI-ORG repos only, branch `mcp-2026-wire-header-add`, base = each repo's default branch, no default-branch pushes, no force, no clones (reads via `gh api` + `raw.githubusercontent.com`).
**Deprecation deadline carried in every PR:** the legacy wire dies **2027-07-28**.

## 1. Selection

The slice was handed to this lane pre-cut and LIVE-deduped: `/Users/nicholas/.hermes/cache/scratch/mig-batch6-slice.json` - **25 unique repo names**, read in order and used exactly as given; no repo substituted, no other slice's pool touched, no re-selection. All 25 are present in `MCP_WIRE_CENSUS_GITHUB_2026-10-07.jsonl` (516 rows) as `migration == "header-add"`, `fork == false`, census era `unknown`.

**Skips: 0.** All 25 exist, none archived, none a fork, none 404 (discovery: 25/25 `status: ready`).

## 2. Results

| # | repo | PR | census era/class | before (local audit) | after (verify) | control | files changed | notes |
|--:|---|---|---|---|---|---|---|---|
| 1 | `docker-compose` | https://github.com/CSOAI-ORG/docker-compose/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2: `MIGRATION_NOTE.md`, `mcp2026_shim.py` | **package.json-only (Node/TypeScript)**: no `pyproject.toml`, no `server.py`; real dep `"@modelcontextprotocol/sdk": "^1.6.1"` left untouched - **no JS pin invented** (no JS SDK release speaks 2026-07-28); vendored shim + honest `MIGRATION_NOTE.md` only; after == before == control by design; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 2, commits 2 |
| 2 | `docker-helper-ai-mcp` | https://github.com/CSOAI-ORG/docker-helper-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `MIGRATION_NOTE.md`, `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; FastMCP -> MCPServer import rename (`mcp.server.fastmcp` raises `ModuleNotFoundError` by design in mcp 2.x); `mcp-wrapper.py`: ShimASGI wired at the streamable-HTTP ingress + served cards 2025-11-25 -> 2026-07-28; note block anchored `^def main(`; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 5, commits 5 |
| 3 | `dockerfile-generator-ai-mcp` | https://github.com/CSOAI-ORG/dockerfile-generator-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `MIGRATION_NOTE.md`, `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; FastMCP -> MCPServer import rename (`mcp.server.fastmcp` raises `ModuleNotFoundError` by design in mcp 2.x); `mcp-wrapper.py`: ShimASGI wired at the streamable-HTTP ingress + served cards 2025-11-25 -> 2026-07-28; note block anchored `^def main(`; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 5, commits 5 |
| 4 | `document-comparison-ai-mcp` | https://github.com/CSOAI-ORG/document-comparison-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `MIGRATION_NOTE.md`, `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; FastMCP -> MCPServer import rename (`mcp.server.fastmcp` raises `ModuleNotFoundError` by design in mcp 2.x); `mcp-wrapper.py`: ShimASGI wired at the streamable-HTTP ingress + served cards 2025-11-25 -> 2026-07-28; note block anchored `^def main(`; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 5, commits 5 |
| 5 | `drone-airspace-governance-mcp` | https://github.com/CSOAI-ORG/drone-airspace-governance-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `MIGRATION_NOTE.md`, `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; FastMCP -> MCPServer import rename (`mcp.server.fastmcp` raises `ModuleNotFoundError` by design in mcp 2.x); `mcp-wrapper.py`: ShimASGI wired at the streamable-HTTP ingress + served cards 2025-11-25 -> 2026-07-28; note block anchored `^def main(`; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 5, commits 5 |
| 6 | `dsrb-defence` | https://github.com/CSOAI-ORG/dsrb-defence/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2: `MIGRATION_NOTE.md`, `mcp2026_shim.py` | **package.json-only (Node/TypeScript)**: no `pyproject.toml`, no `server.py`; real dep `"@modelcontextprotocol/sdk": "^1.6.1"` left untouched - **no JS pin invented** (no JS SDK release speaks 2026-07-28); vendored shim + honest `MIGRATION_NOTE.md` only; after == before == control by design; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 2, commits 2 |
| 7 | `ecommerce-ai-mcp` | https://github.com/CSOAI-ORG/ecommerce-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `MIGRATION_NOTE.md`, `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; FastMCP -> MCPServer import rename (`mcp.server.fastmcp` raises `ModuleNotFoundError` by design in mcp 2.x); `mcp-wrapper.py`: ShimASGI wired at the streamable-HTTP ingress + served cards 2025-11-25 -> 2026-07-28; note block anchored `^def main(`; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 5, commits 5 |
| 8 | `education-ai-mcp` | https://github.com/CSOAI-ORG/education-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `MIGRATION_NOTE.md`, `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; FastMCP -> MCPServer import rename (`mcp.server.fastmcp` raises `ModuleNotFoundError` by design in mcp 2.x); `mcp-wrapper.py`: ShimASGI wired at the streamable-HTTP ingress + served cards 2025-11-25 -> 2026-07-28; note block anchored `^def main(`; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 5, commits 5 |
| 9 | `email-automation-mcp` | https://github.com/CSOAI-ORG/email-automation-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `MIGRATION_NOTE.md`, `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; FastMCP -> MCPServer import rename (`mcp.server.fastmcp` raises `ModuleNotFoundError` by design in mcp 2.x); `mcp-wrapper.py`: ShimASGI wired at the streamable-HTTP ingress + served cards 2025-11-25 -> 2026-07-28; note block anchored `^def main(`; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 5, commits 5 |
| 10 | `email-validator-ai-mcp` | https://github.com/CSOAI-ORG/email-validator-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `MIGRATION_NOTE.md`, `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; FastMCP -> MCPServer import rename (`mcp.server.fastmcp` raises `ModuleNotFoundError` by design in mcp 2.x); `mcp-wrapper.py`: ShimASGI wired at the streamable-HTTP ingress + served cards 2025-11-25 -> 2026-07-28; note block anchored `^def main(`; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 5, commits 5 |
| 11 | `emoji-ai-mcp` | https://github.com/CSOAI-ORG/emoji-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `MIGRATION_NOTE.md`, `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; FastMCP -> MCPServer import rename (`mcp.server.fastmcp` raises `ModuleNotFoundError` by design in mcp 2.x); `mcp-wrapper.py`: ShimASGI wired at the streamable-HTTP ingress + served cards 2025-11-25 -> 2026-07-28; note block anchored `^def main(`; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 5, commits 5 |
| 12 | `employment-ai` | https://github.com/CSOAI-ORG/employment-ai/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2: `MIGRATION_NOTE.md`, `mcp2026_shim.py` | **package.json-only (Node/TypeScript)**: no `pyproject.toml`, no `server.py`; real dep `"@modelcontextprotocol/sdk": "^1.3.0"` left untouched - **no JS pin invented** (no JS SDK release speaks 2026-07-28); vendored shim + honest `MIGRATION_NOTE.md` only; after == before == control by design; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 2, commits 2 |
| 13 | `encoder-ai-mcp` | https://github.com/CSOAI-ORG/encoder-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `MIGRATION_NOTE.md`, `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; FastMCP -> MCPServer import rename (`mcp.server.fastmcp` raises `ModuleNotFoundError` by design in mcp 2.x); `mcp-wrapper.py`: ShimASGI wired at the streamable-HTTP ingress + served cards 2025-11-25 -> 2026-07-28; note block anchored `^def main(`; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 5, commits 5 |
| 14 | `energy-ai` | https://github.com/CSOAI-ORG/energy-ai/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2: `MIGRATION_NOTE.md`, `mcp2026_shim.py` | **package.json-only (Node/TypeScript)**: no `pyproject.toml`, no `server.py`; real dep `"@modelcontextprotocol/sdk": "^1.6.1"` left untouched - **no JS pin invented** (no JS SDK release speaks 2026-07-28); vendored shim + honest `MIGRATION_NOTE.md` only; after == before == control by design; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 2, commits 2 |
| 15 | `env-manager-ai-mcp` | https://github.com/CSOAI-ORG/env-manager-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `MIGRATION_NOTE.md`, `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; FastMCP -> MCPServer import rename (`mcp.server.fastmcp` raises `ModuleNotFoundError` by design in mcp 2.x); `mcp-wrapper.py`: ShimASGI wired at the streamable-HTTP ingress + served cards 2025-11-25 -> 2026-07-28; note block anchored `^def main(`; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 5, commits 5 |
| 16 | `event-planning-ai-mcp` | https://github.com/CSOAI-ORG/event-planning-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `MIGRATION_NOTE.md`, `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; FastMCP -> MCPServer import rename (`mcp.server.fastmcp` raises `ModuleNotFoundError` by design in mcp 2.x); `mcp-wrapper.py`: ShimASGI wired at the streamable-HTTP ingress + served cards 2025-11-25 -> 2026-07-28; note block anchored `^def main(`; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 5, commits 5 |
| 17 | `expense-tracker-ai-mcp` | https://github.com/CSOAI-ORG/expense-tracker-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `MIGRATION_NOTE.md`, `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; FastMCP -> MCPServer import rename (`mcp.server.fastmcp` raises `ModuleNotFoundError` by design in mcp 2.x); `mcp-wrapper.py`: ShimASGI wired at the streamable-HTTP ingress + served cards 2025-11-25 -> 2026-07-28; note block anchored `^def main(`; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 5, commits 5 |
| 18 | `explainability-report-mcp` | https://github.com/CSOAI-ORG/explainability-report-mcp/pull/7 (PR #7) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; FastMCP -> MCPServer import rename (`mcp.server.fastmcp` raises `ModuleNotFoundError` by design in mcp 2.x); stdio: `http_app()` enable path (`ShimASGI(mcp.streamable_http_app(json_response=True))`); note block anchored `^def main(`; repo already had 6 PR(s) on other heads - this PR is this lane's first on `mcp-2026-wire-header-add`; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4, commits 4 |
| 19 | `faker-ai-mcp` | https://github.com/CSOAI-ORG/faker-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `MIGRATION_NOTE.md`, `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; FastMCP -> MCPServer import rename (`mcp.server.fastmcp` raises `ModuleNotFoundError` by design in mcp 2.x); `mcp-wrapper.py`: ShimASGI wired at the streamable-HTTP ingress + served cards 2025-11-25 -> 2026-07-28; note block anchored `^def main(`; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 5, commits 5 |
| 20 | `feedback-analyzer-ai-mcp` | https://github.com/CSOAI-ORG/feedback-analyzer-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `MIGRATION_NOTE.md`, `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; FastMCP -> MCPServer import rename (`mcp.server.fastmcp` raises `ModuleNotFoundError` by design in mcp 2.x); `mcp-wrapper.py`: ShimASGI wired at the streamable-HTTP ingress + served cards 2025-11-25 -> 2026-07-28; note block anchored `^def main(`; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 5, commits 5 |
| 21 | `fetch-http` | https://github.com/CSOAI-ORG/fetch-http/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2: `MIGRATION_NOTE.md`, `mcp2026_shim.py` | **package.json-only (Node/TypeScript)**: no `pyproject.toml`, no `server.py`; real dep `"@modelcontextprotocol/sdk": "^1.6.1"` left untouched - **no JS pin invented** (no JS SDK release speaks 2026-07-28); vendored shim + honest `MIGRATION_NOTE.md` only; after == before == control by design; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 2, commits 2 |
| 22 | `file-organizer-ai-mcp` | https://github.com/CSOAI-ORG/file-organizer-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `MIGRATION_NOTE.md`, `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; FastMCP -> MCPServer import rename (`mcp.server.fastmcp` raises `ModuleNotFoundError` by design in mcp 2.x); `mcp-wrapper.py`: ShimASGI wired at the streamable-HTTP ingress + served cards 2025-11-25 -> 2026-07-28; note block anchored `^def main(`; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 5, commits 5 |
| 23 | `filesystem-ops` | https://github.com/CSOAI-ORG/filesystem-ops/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2: `MIGRATION_NOTE.md`, `mcp2026_shim.py` | **package.json-only (Node/TypeScript)**: no `pyproject.toml`, no `server.py`; real dep `"@modelcontextprotocol/sdk": "^1.6.1"` left untouched - **no JS pin invented** (no JS SDK release speaks 2026-07-28); vendored shim + honest `MIGRATION_NOTE.md` only; after == before == control by design; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 2, commits 2 |
| 24 | `financial-ai` | https://github.com/CSOAI-ORG/financial-ai/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2: `MIGRATION_NOTE.md`, `mcp2026_shim.py` | **package.json-only (Node/TypeScript)**: no `pyproject.toml`, no `server.py`; real dep `"@modelcontextprotocol/sdk": "^1.3.0"` left untouched - **no JS pin invented** (no JS SDK release speaks 2026-07-28); vendored shim + honest `MIGRATION_NOTE.md` only; after == before == control by design; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 2, commits 4 |
| 25 | `fishkeeper-ai-mcp` | https://github.com/CSOAI-ORG/fishkeeper-ai-mcp/pull/21 (PR #21) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `MIGRATION_NOTE.md`, `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; FastMCP -> MCPServer import rename (`mcp.server.fastmcp` raises `ModuleNotFoundError` by design in mcp 2.x); `mcp-wrapper.py`: ShimASGI wired at the streamable-HTTP ingress + served cards 2025-11-25 -> 2026-07-28; note block anchored `^def main(`; repo already had 20 PR(s) on other heads - this PR is this lane's first on `mcp-2026-wire-header-add`; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 5, commits 5 |

Every PR body carries: class `header-add`, the runbook steps applied, the verify command
`PYTHONPATH= /opt/homebrew/bin/python3.11 ~/clawd/mcp_wire_audit.py audit --local <repo>`, the
before/after/control table, the line **"After-rows are note-text-driven until post-merge re-audit"**,
a link to `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md` and the 2027-07-28 deprecation deadline.
All 25 bodies were re-read after creation and checked against 9 required elements: **25/25 pass
(`missing_body_elements: none` on every PR).**

## 3. What the runbook produced per repo

This batch is one generated family (18 Python + 7 Node/TypeScript), so the diff is near-identical:

* **`pyproject.toml` (18/18 Python repos):** a real mcp dependency line existed everywhere ->
  `"mcp>=1.0.0"` -> `"mcp>=2.0.0"` on all 18. **No pin was invented anywhere - every repo had a
  real line to pin.** The packaging include list gained the shim (`only-include += "mcp2026_shim.py"`
  on all 18) so the vendored module ships in the wheel.
* **`server.py` (18/18):** `from mcp.server.fastmcp import FastMCP` ->
  `from mcp.server.mcpserver import MCPServer as FastMCP` (forced companion rename), plus the
  migration-note block anchored on `^def main(` - all 18 declared `def main(`, so the widened
  wave-4 anchor was sufficient and **no note block was silently dropped** (18/18 banners present).
  A deep scan additionally fetched **every remaining `.py` in all 18 repos** (files the
  depth-limited reconstruction never fetched) and found **0 leftover `mcp.server.fastmcp`
  imports** - so the pin cannot leave a broken import behind.
* **`mcp2026_shim.py` (25/25):** vendored at the repo root (665 lines, stdlib, zero third-party deps).
* **HTTP (17):** these repos carry `mcp-wrapper.py` (`transport="streamable-http"`), so the ingress
  is really wired: `ShimASGI(...)` wraps `mcp_server.streamable_http_app(json_response=True,
  host=HOST)` in `__main__`, and the served declarations (`protocolVersion` / `mcp_version`)
  moved 2025-11-25 -> 2026-07-28. That is 5 changed files each.
* **stdio (1):** `explainability-report-mcp` has no wrapper -> `headers N/A at runtime` +
  the `http_app()` enable path (`ShimASGI(mcp.streamable_http_app(json_response=True))`), 4 files.
* **JS (7):** `docker-compose`, `dsrb-defence`, `employment-ai`, `energy-ai`, `fetch-http`,
  `filesystem-ops`, `financial-ai` are `package.json`-only TypeScript/Node servers: no
  `pyproject.toml`, no `server.py`. The real dependency
  `"@modelcontextprotocol/sdk": "<as-declared>"` was **left untouched** - no JS SDK release speaks
  2026-07-28, and this lane does not invent JS pins. No note-comment block was added to the TS
  entry either (the shim is Python and cannot run inside a Node process; plan section 4 places it
  at the ingress). Those PRs ship exactly 2 files - `mcp2026_shim.py` + an honest
  `MIGRATION_NOTE.md` - and their bodies state plainly that **the PR is not evidence the server
  speaks 2026-07-28**.
* **`MIGRATION_NOTE.md` (25/25):** class, transport reality, steps applied, verify command with
  the before/after/control rows, the honesty paragraph, and follow-ups.
* **JS pin rule:** no `@modelcontextprotocol/sdk` pin was written in any of the 7; the wave-1 rule
  stands (verified again this batch: `mcp` 2.3.0 is the first Python SDK speaking 2026-07-28,
  while the JS SDK has no such release).

## 4. Verification receipts

Local audits ran against a fully reconstructed tree per repo (every scannable file in the default
branch's `git/trees` listing, fetched via `raw.githubusercontent.com`), before patching, after
patching, and with the migration-note block deleted (control):

| state | repos | reading |
|---|---|---|
| before | 18 | `2026-07 / header-add` - the `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (registry token, known false-positive class), **not** wire code |
| before | 7 | `unknown / header-add` (the Node/TypeScript repos) |
| **after (this branch)** | **18** | **`2026-07 / handshake-removal`** |
| after | 7 | `unknown / header-add` - unchanged by design, no code/manifest change was permissible |
| control (note block removed) | 18 | `2026-07 / header-add` - `session-id` disappears (0/25 control rows carry it vs 18/25 after rows), which is the provenance proof |
| control (note text removed) | 7 | `unknown / header-add` |

* **`py_compile` on every patched Python file: 73/73 OK** (18 `server.py` + 17 `mcp-wrapper.py` +
  38 other tree files), re-run after the wrapper pass below.
* **Static verification against the real SDK (not from memory):** `mcp-2.3.0` was downloaded and
  its wheel read: `mcp/server/mcpserver/__init__.py` **exports `MCPServer`** (so the renamed
  import resolves), `mcp/server/fastmcp.py` **raises `ModuleNotFoundError` by design** ("FastMCP
  is now mcp.server.mcpserver.MCPServer" - so the pin really does force the rename), and
  `streamable_http_app(*, json_response=..., host=...)` accepts exactly the keyword arguments this
  batch ships.
* **CI sampled on 3 PRs (green where checks exist):** `docker-helper-ai-mcp`
  `test (3.10)` / `test (3.11)` / `test (3.12)` all **completed/success** + Cursor Security Agent
  and Approval Agent success + Bugbot neutral; `explainability-report-mcp` `test (3.11)` /
  `test (3.12)` **success** ×2 + Cursor agents success; `financial-ai` (JS) Bugbot neutral +
  Approval success, Security Agent still in progress at read time. The two Python samples prove
  the `mcp>=2.0.0` pin **and** the `FastMCP -> MCPServer` rename import and run under mcp 2.x.
* **PR read-back after creation (all 25):** `state: open`, `base: main`, head
  `mcp-2026-wire-header-add`, `changed_files` 5 (17 repos) / 4 (1) / 2 (7), `commits`
  5 (17) / 4 (2) / 2 (6).
* **Byte-level branch verification (all 25, 2 tree calls each):** the branch tree was diffed
  against the default-branch tree and every added path's git blob sha compared with the local
  patched file - **25/25 `set_equal: true`, 25/25 `sha_mismatch: []`, 25/25
  `pr_changed_files_matches: true`.** The PR diff is exactly this run's intended content, nothing
  more, nothing less.
* **PR body verification (all 25):** re-read and checked for class, steps, verify command, plan
  link, 2027-07-28 deadline, all three table rows and the honesty line - **25/25 pass**.
* **Default branches untouched (sampled 3):** `GET contents/MIGRATION_NOTE.md?ref=main` -> 404
  on `docker-compose`, `fishkeeper-ai-mcp`, `explainability-report-mcp`. No push, no force, no
  merge was made by this lane; every write went through `PUT contents` / `POST git/refs` /
  `POST pulls` on the `mcp-2026-wire-header-add` branch only.
* Read the `after` column honestly: the audit tool excludes its own shim (`SELF_FILES`) and does
  not scan `.md`, so the new `protocol-2026-07-28` / `mcp-method-header` / `mcp-name-header` /
  `server-discover` signals are read from the migration-note text in the entry file, and
  `session-id` is prose about the shim *stripping* that header - not session code. Runtime
  evidence for the wire is the `mcp>=2.0.0` SDK pin (2.3.0 speaks 2026-07-28) plus the shim at
  the ingress; `mcp>=2.0.0` alone is not a wire signal for this scanner.
  **After-rows are note-text-driven until post-merge re-audit.**

## 5. API budget and rate discipline

* **436 core-quota `gh api` calls against the 600 hard cap**, derived from the per-stage counters
  and the per-repo call plan recorded in `mig6b_push.json`: 50 discovery (25 repo meta + 25
  recursive trees), 18 deep-scan trees, 275 push/PR (25 `pulls?head=` pre-checks, 24 branch
  creations x 4, 1 pre-existing branch, 103 `PUT contents`, 25 `POST pulls`, 25 read-backs - the
  derived figure reproduces the second run's printed `API calls: 18` for its 2 repos exactly),
  81 verification (25 pulls + 50 trees + 3 default-branch probes + 3 CI reads), 12 CI follow-up
  reads (3 `pulls` + 9 `check-runs`/`status`). Rate-limit probes (`gh api rate_limit`, which does
  not count against the core quota) read **5000/5000** at start and **5000/5000** after the
  verification pass; the quota window reset mid-run, so the counter cannot be used to cross-check
  the derived total - that is why the figure is stated as derived rather than measured.
* 0.30 s pacing between calls, 30 s exponential backoff armed for secondary limits: **0
  secondary-limit hits.** Deterministic HTTP 4xx are not retried - that policy is what caps the
  budget.
* **Wall time: ~27 minutes** (02:56 UTC first artifact -> 03:24 UTC verification complete),
  well inside the 90-minute budget.

## 6. Known gaps and incidents

* **A silently-failing regex was caught before any PR was opened.** The first patch pass bumped
  the 17 wrapper cards but did not replace their `__main__` block, because the block-match pattern
  lost one character (`. __main__ :` instead of `. __main__ . :`) and a `None` match falls through
  without an error. `py_compile` and the audit both stayed green, so nothing surfaced on its own;
  a targeted wrapper pass (`mig6b_wrapper_fix.py`, 17/17 `wired`) re-applied it, and the
  byte-level branch verification then confirmed all 17 wrappers on GitHub carry `ShimASGI` +
  `uvicorn.run`. The pattern is fixed in the scratch script.
* **1 of the 25 had a pre-existing branch and no PR:** `financial-ai`'s
  `mcp-2026-wire-header-add` already existed with 2 commits from an earlier run of this same
  pattern (no open PR, so the 422 rule was not triggered). This lane pushed its 2 files on top
  (4 commits total, no force) and the verification pass re-read the branch diff as byte-identical
  to this run's intended content (`set_equal: true`, `sha_mismatch: []`, `changed_files: 2`).
* **0 pre-existing open PRs on this head across the 25** (`pulls?head=...&state=all` -> 0 open, 0
  closed on every repo), so the 422-recovery path (byte-identical -> re-PATCH body, materially
  different -> SKIP) never had to fire. It is implemented in `mig6b_push.py` and would have
  applied had a PR existed.
* **Repo PR numbers >1 do not indicate a collision:** `explainability-report-mcp` is PR #7 and
  `fishkeeper-ai-mcp` is PR #21 - those repos simply had 6 / 20 earlier PRs on other branches.
  Both were created by this run inside the same `03:10:25Z`-`03:18:31Z` window as the other 23.
* All 25 PRs are **open, not merged**; the `after` rows are note-text-driven (section 4): re-audit
  after merge and after a live probe (plan section 6.5) before anyone quotes `migration: none`.
* The 7 JS repos **cannot** move class with this PR: they are blocked on an upstream JS SDK
  release speaking 2026-07-28 (or a Node-capable ingress shim). Their after rows are deliberately
  identical to their before rows; a reviewer must not read those PRs as 2026-07-28 support.
* Static declaration surfaces (`.well-known/*.json`, `server.json`, `smithery.yaml`,
  `README.md`) still declare older wires - listed as follow-ups in each `MIGRATION_NOTE.md`, not
  silent-edited (Art. 21: a declaration change gets its own commit).
* The before-era `2026-07` on 18 repos is the `.well-known/agent-card.json` `"mcp_name"` token, a
  scanner false-positive: those repos are **not** evidence of 2026-07-28 wire support before this
  branch. The census row (`unknown / header-add`) is the honest pre-state.
* The harness killed the first push process at its 420 s foreground cap after 23/25 PRs; the
  script is resumable (it keeps completed records) and the remaining 2 were opened on a second
  invocation with `API calls: 18`.
* No git commit in `~/clawd` from this lane - the parent lane commits this report.

## 7. Artifacts

* `MCP_HEADER_ADD_WAVE2_BATCH6_2026-10-08.md` - this report.
* Per repo, on `mcp-2026-wire-header-add`: `mcp2026_shim.py`, `MIGRATION_NOTE.md`, pinned
  `pyproject.toml`, edited `server.py`, and (17 repos) `mcp-wrapper.py`.
* Scratch (pruned after 24 h): `~/.hermes/cache/scratch/mig6b_{discover,before,patch,deepscan,
  wrapper_fix,audit,note,push,verify}.py`, `mig6b_{discovery,before,patch,deepscan,wrapperfix,
  audits,note,push,verify}.json`.
* `/tmp/mig6b/` reconstructed trees - removed at the end of this lane.

---

Totals: **25 slice repos -> 0 skips, 25 open PRs** (created 2026-10-08 03:10:25Z-03:18:31Z).
API **436/600** core (derived, section 5). Wall **~27 min** (02:56-03:24 UTC). 0
secondary-rate-limit hits, 0 default-branch writes, 0 force pushes, 0 invented pins, 0
pre-existing-PR collisions.
