# MCP header-add migration wave 2, batch 5 (25 PRs)

**Date:** 2026-10-08 - **Lane:** M4 MCP-migration (wave 2, batch 5) - **Status:** complete, 25/25 PRs open
**Runbook:** `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md` section 3 (header-add) + section 4 (the shim as bridge)
**Pattern proven by:** `MCP_HEADER_ADD_WAVE2_BATCH1_2026-10-08.md` (25/25) and `MCP_HEADER_ADD_WAVE1_2026-10-07.md` (10/10) - same branch name, same steps, same verify.
**Scope:** CSOAI-ORG repos only, branch `mcp-2026-wire-header-add`, base = each repo's default branch, no default-branch pushes, no force, no clones (reads via `gh api` + `raw.githubusercontent.com`).
**Deprecation deadline carried in every PR:** the legacy wire dies **2027-07-28**.

## 1. Selection

The exact 25 repos in `~/.hermes/cache/scratch/mig-batch5-slice.json` (live-deduped by the parent lane).
Reconstructed via `gh api repos/CSOAI-ORG/<repo>` (meta) + `git/trees/<default>?recursive=1` + raw fetches
under `/tmp/mig5b/<repo>/`. All 25 exist, **none archived, none a fork**, default branch `main` on all 25
-> **0 skips**. All 25 are in `MCP_WIRE_CENSUS_GITHUB_2026-10-07.jsonl` as era `unknown` / class `header-add`.

## 2. Results

| # | repo | PR | census era/class | before (local audit) | after (verify) | control | files changed | notes |
|--:|---|---|---|---|---|---|---|---|
| 1 | `meok-uae-rta-transport-mcp` | meok-uae-rta-transport-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp[cli]>=1.3.0"` -> `"mcp>=2.0.0"`; py-modules += "mcp2026_shim"; stdio: `headers N/A at runtime` + `http_app()` enable path; stale empty branch pointer pre-existed at main tip (branch_sha == main_sha, 0 PRs ever) - treated as no other-lane work, our bytes written, no force; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 2 | `meok-uas-commercial-drone-mcp` | meok-uas-commercial-drone-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp[cli]>=1.3.0"` -> `"mcp>=2.0.0"`; py-modules += "mcp2026_shim"; stdio: `headers N/A at runtime` + `http_app()` enable path; stale empty branch pointer pre-existed at main tip (branch_sha == main_sha, 0 PRs ever) - treated as no other-lane work, our bytes written, no force; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 3 | `meok-uk-phv-tfl-mcp` | meok-uk-phv-tfl-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp[cli]>=1.3.0"` -> `"mcp>=2.0.0"`; py-modules += "mcp2026_shim"; stdio: `headers N/A at runtime` + `http_app()` enable path; stale empty branch pointer pre-existed at main tip (branch_sha == main_sha, 0 PRs ever) - treated as no other-lane work, our bytes written, no force; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 4 | `meok-vehicle-handover-mcp` | meok-vehicle-handover-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp[cli]>=1.3.0"` -> `"mcp>=2.0.0"`; py-modules += "mcp2026_shim"; stdio: `headers N/A at runtime` + `http_app()` enable path; stale empty branch pointer pre-existed at main tip (branch_sha == main_sha, 0 PRs ever) - treated as no other-lane work, our bytes written, no force; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 5 | `meok-eat-mcp` | meok-eat-mcp/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `src/meok_eat_mcp/server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; no packaging include list - shim in-tree only (not claimed to ship in wheel); stdio: `headers N/A at runtime` + `http_app()` enable path; non-root entry `src/meok_eat_mcp/server.py`, note anchored at `if __name__`; stale empty branch pointer pre-existed at main tip (branch_sha == main_sha, 0 PRs ever) - treated as no other-lane work, our bytes written, no force; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 6 | `eudi-wallet-mcp` | eudi-wallet-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp[cli]>=1.3.0"` -> `"mcp>=2.0.0"`; py-modules += "mcp2026_shim"; stdio: `headers N/A at runtime` + `http_app()` enable path; stale empty branch pointer pre-existed at main tip (branch_sha == main_sha, 0 PRs ever) - treated as no other-lane work, our bytes written, no force; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 7 | `fda-samd-mcp` | fda-samd-mcp/pull/8 (PR #8) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; only-include += "mcp2026_shim.py"; stdio: `headers N/A at runtime` + `http_app()` enable path; stale empty branch pointer pre-existed at main tip (branch_sha == main_sha, 0 PRs ever) - treated as no other-lane work, our bytes written, no force; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 8 | `haulage-uk-compliance-mcp` | haulage-uk-compliance-mcp/pull/9 (PR #9) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; only-include += "mcp2026_shim.py"; stdio: `headers N/A at runtime` + `http_app()` enable path; stale empty branch pointer pre-existed at main tip (branch_sha == main_sha, 0 PRs ever) - treated as no other-lane work, our bytes written, no force; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 9 | `korea-ai-basic-act-mcp` | korea-ai-basic-act-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp[cli]>=1.3.0"` -> `"mcp>=2.0.0"`; py-modules += "mcp2026_shim"; stdio: `headers N/A at runtime` + `http_app()` enable path; stale empty branch pointer pre-existed at main tip (branch_sha == main_sha, 0 PRs ever) - treated as no other-lane work, our bytes written, no force; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 10 | `mdr-medical-device-mcp` | mdr-medical-device-mcp/pull/8 (PR #8) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; only-include += "mcp2026_shim.py"; stdio: `headers N/A at runtime` + `http_app()` enable path; stale empty branch pointer pre-existed at main tip (branch_sha == main_sha, 0 PRs ever) - treated as no other-lane work, our bytes written, no force; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 11 | `mitre-atlas-mcp` | mitre-atlas-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; only-include += "mcp2026_shim.py"; stdio: `headers N/A at runtime` + `http_app()` enable path; stale empty branch pointer pre-existed at main tip (branch_sha == main_sha, 0 PRs ever) - treated as no other-lane work, our bytes written, no force; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 12 | `mitre-attack-mcp` | mitre-attack-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; only-include += "mcp2026_shim.py"; stdio: `headers N/A at runtime` + `http_app()` enable path; stale empty branch pointer pre-existed at main tip (branch_sha == main_sha, 0 PRs ever) - treated as no other-lane work, our bytes written, no force; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 13 | `openchronicle-mcp` | openchronicle-mcp/pull/4 (PR #4) | unknown / header-add | pre-2025-06 / full | **pre-2025-06 / full** | pre-2025-06 / full | 2: `MIGRATION_NOTE.md`, `mcp2026_shim.py` | **pin + rename applied then REVERTED**: CI red - `MCPServer.__init__() got an unexpected keyword argument 'host'` (29 failed / 41 errors / 316 passed, actions/runs/37722454245/job/113133007633) - documentation + shim only now; local class reads `pre-2025-06 / full` from `tests/` handshake fixtures, not the serving path; no packaging include list (setuptools `packages.find`); read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 2 (9 commits - 4 of them the revert, no force allowed) |
| 14 | `mifid-ii-ai-mcp` | mifid-ii-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; only-include += "mcp2026_shim.py"; stdio: `headers N/A at runtime` + `http_app()` enable path; stale empty branch pointer pre-existed at main tip (branch_sha == main_sha, 0 PRs ever) - treated as no other-lane work, our bytes written, no force; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 15 | `skip-hire-ai-mcp` | skip-hire-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; only-include += "mcp2026_shim.py"; stdio: `headers N/A at runtime` + `http_app()` enable path; stale empty branch pointer pre-existed at main tip (branch_sha == main_sha, 0 PRs ever) - treated as no other-lane work, our bytes written, no force; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 16 | `oasf-agent-directory-mcp` | oasf-agent-directory-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp[cli]>=1.3.0"` -> `"mcp>=2.0.0"`; py-modules += "mcp2026_shim"; stdio: `headers N/A at runtime` + `http_app()` enable path; stale empty branch pointer pre-existed at main tip (branch_sha == main_sha, 0 PRs ever) - treated as no other-lane work, our bytes written, no force; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 17 | `nrswa-ai-mcp` | nrswa-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `MIGRATION_NOTE.md`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; only-include += "mcp2026_shim.py"; stdio: `headers N/A at runtime` + `http_app()` enable path; stale empty branch pointer pre-existed at main tip (branch_sha == main_sha, 0 PRs ever) - treated as no other-lane work, our bytes written, no force; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 4 |
| 18 | `database-universal-mcp` | database-universal-mcp/pull/21 (PR #21) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `MIGRATION_NOTE.md`, `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; only-include += "mcp2026_shim.py"; HTTP entry `mcp-wrapper.py` -> `ShimASGI` wired + served cards 2025-11-25 -> 2026-07-28; stale empty branch pointer pre-existed at main tip (branch_sha == main_sha, 0 PRs ever) - treated as no other-lane work, our bytes written, no force; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 5 |
| 19 | `dataprivacy-ai-mcp` | dataprivacy-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `MIGRATION_NOTE.md`, `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; only-include += "mcp2026_shim.py"; HTTP entry `mcp-wrapper.py` -> `ShimASGI` wired + served cards 2025-11-25 -> 2026-07-28; stale empty branch pointer pre-existed at main tip (branch_sha == main_sha, 0 PRs ever) - treated as no other-lane work, our bytes written, no force; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 5 |
| 20 | `date-calculator-ai-mcp` | date-calculator-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `MIGRATION_NOTE.md`, `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; only-include += "mcp2026_shim.py"; HTTP entry `mcp-wrapper.py` -> `ShimASGI` wired + served cards 2025-11-25 -> 2026-07-28; stale empty branch pointer pre-existed at main tip (branch_sha == main_sha, 0 PRs ever) - treated as no other-lane work, our bytes written, no force; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 5 |
| 21 | `deepfake-detector-mcp` | deepfake-detector-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `MIGRATION_NOTE.md`, `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; only-include += "mcp2026_shim.py"; HTTP entry `mcp-wrapper.py` -> `ShimASGI` wired + served cards 2025-11-25 -> 2026-07-28; stale empty branch pointer pre-existed at main tip (branch_sha == main_sha, 0 PRs ever) - treated as no other-lane work, our bytes written, no force; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 5 |
| 22 | `dependency-updater-ai-mcp` | dependency-updater-ai-mcp/pull/18 (PR #18) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `MIGRATION_NOTE.md`, `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; only-include += "mcp2026_shim.py"; HTTP entry `mcp-wrapper.py` -> `ShimASGI` wired + served cards 2025-11-25 -> 2026-07-28; stale empty branch pointer pre-existed at main tip (branch_sha == main_sha, 0 PRs ever) - treated as no other-lane work, our bytes written, no force; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 5 |
| 23 | `devops-ai-mcp` | devops-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `MIGRATION_NOTE.md`, `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; only-include += "mcp2026_shim.py"; HTTP entry `mcp-wrapper.py` -> `ShimASGI` wired + served cards 2025-11-25 -> 2026-07-28; stale empty branch pointer pre-existed at main tip (branch_sha == main_sha, 0 PRs ever) - treated as no other-lane work, our bytes written, no force; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 5 |
| 24 | `diff-ai-mcp` | diff-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `MIGRATION_NOTE.md`, `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; only-include += "mcp2026_shim.py"; HTTP entry `mcp-wrapper.py` -> `ShimASGI` wired + served cards 2025-11-25 -> 2026-07-28; stale empty branch pointer pre-existed at main tip (branch_sha == main_sha, 0 PRs ever) - treated as no other-lane work, our bytes written, no force; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 5 |
| 25 | `digital-human-library` | digital-human-library/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2: `MIGRATION_NOTE.md`, `mcp2026_shim.py` | package.json only - **no JS pin invented** (`@modelcontextprotocol/sdk ^1.0.0`, no JS release speaks 2026-07-28); no `pyproject.toml` / `server.py` to note-block; branch created by this lane; read-back: state open, base `main`, head `mcp-2026-wire-header-add`, changed_files 2 |

Every PR body carries: class `header-add`, the runbook steps applied, the verify command
`PYTHONPATH= /opt/homebrew/bin/python3.11 ~/clawd/mcp_wire_audit.py audit --local <repo>`, the
before/after/control table, the line **"After-rows are note-text-driven until post-merge re-audit"**,
a link to `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md` and the 2027-07-28 deprecation deadline.

**Totals: 25 PRs opened, 0 skipped, 0 force-pushes, 0 default-branch writes.**
`changed_files` after read-back: **16 x 4** (stdio Python), **7 x 5** (HTTP wrapper repos),
**2 x 2** (`digital-human-library`, `openchronicle-mcp` - both documentation + shim only).

## 3. What the runbook produced per repo

* **`pyproject.toml` (24/24 with a real mcp line):** 17 x `"mcp>=1.0.0"` and 7 x `"mcp[cli]>=1.3.0"`
  -> `"mcp>=2.0.0"`. **No pin was invented anywhere** - every Python repo had a real dependency line.
  **23 of the 24 pins ship**; `openchronicle-mcp`'s pin was applied, CI-failed, and is **reverted**
  (section 4). `digital-human-library` is package.json-only -> **no `@modelcontextprotocol/sdk` pin
  invented** (no JS release speaks 2026-07-28).
* **Packaging include list:** 15 x `only-include += "mcp2026_shim.py"` + 7 x `py-modules += "mcp2026_shim"`
  = **22 extended**. 2 repos have no include array to extend (`meok-eat-mcp` hatch `packages = [...]`,
  `openchronicle-mcp` setuptools `packages.find`) -> recorded honestly as *shim in-tree only, not claimed
  to ship in the wheel*; no hatch/setuptools config was invented.
* **`FastMCP` -> `MCPServer`:** 24 renames applied (`from mcp.server.fastmcp import FastMCP` ->
  `from mcp.server.mcpserver import MCPServer as FastMCP`), forced by the pin because
  `mcp.server.fastmcp` raises `ModuleNotFoundError` by design in mcp 2.x; **23 ship**
  (`openchronicle-mcp` reverted with the pin). Every `FastMCP(...)` call site in the slice was checked
  for kwargs that `MCPServer.__init__` rejects - only `openchronicle-mcp` passes `host=`/`port=`
  (plus `streamable_http_path=`/`transport_security=`); the other 23 pass a name and optionally
  `instructions=`, which mcp 2.x accepts.
* **`mcp2026_shim.py` (25/25):** vendored at the repo root (665 lines, stdlib, zero third-party deps).
* **Migration-note block (23 shipped):** anchored `^def main(` where the entry declares it
  (`def main() -> None:` on the repos that use it), `^if __name__` as the fallback
  (`meok-eat-mcp`), always in the real entry file - `server.py` on 22 repos,
  `src/meok_eat_mcp/server.py` on one. 16 blocks carry the `http_app()` enable path
  (`ShimASGI(mcp.streamable_http_app(json_response=True))`), 7 carry the "HTTP is wired in
  `mcp-wrapper.py`" variant. `openchronicle-mcp`'s block was reverted with the pin; its note block had
  sat in `src/openchronicle/interfaces/mcp/__main__.py` (below the scanner's depth cap, so it never
  moved the audit rows anyway).
* **HTTP (7 - `database-universal`, `dataprivacy-ai`, `date-calculator-ai`, `deepfake-detector-ai`,
  `dependency-updater-ai`, `devops-ai`, `diff-ai`):** `mcp-wrapper.py` runs
  `transport="streamable-http"` -> the ingress is really wired: `ShimASGI(...)` wraps
  `mcp_server.streamable_http_app(json_response=True)` in `__main__`, and the in-code served
  declarations (`protocolVersion` / `mcp_version`) moved 2025-11-25 -> 2026-07-28. That is 5 changed
  files each; the other 16 Python repos are 4.
* **`MIGRATION_NOTE.md` (25/25):** class, transport reality, steps applied, verify command with the
  before/after/control rows, the honesty paragraph, follow-ups.
* **JS:** no JS server was silently edited. `digital-human-library` keeps `@modelcontextprotocol/sdk
  ^1.0.0` untouched, gains the vendored shim + a note that says plainly **this PR is not evidence of
  2026-07-28 support**.

## 4. Verification receipts

Local audits ran against a fully reconstructed tree per repo (every scannable file in the default
branch's `git/trees` listing, fetched via `raw.githubusercontent.com`), before patching, after
patching, and with the migration-note block deleted (control):

| state | repos | reading |
|---|---|---|
| before | 22 | `2026-07 / header-add` - the `2026-07` is `.well-known/agent-card.json`/`mcp-server-card.json` `mcp_name`-class token (present on 22/25), a known scanner false-positive, not wire code |
| before | 2 | `unknown / header-add` (`meok-eat-mcp`, `digital-human-library`) |
| before | 1 | `pre-2025-06 / full` (`openchronicle-mcp`) - `protocol-2025-03-26` + `initialize-handshake` come from `tests/test_unified_asgi.py` + `scripts/smoke_test.py` fixtures, not the serving path |
| **after (this branch)** | **23** | **`2026-07 / handshake-removal`** |
| after | 1 | `unknown / header-add` (`digital-human-library` - docs + shim only, by design) |
| after | 1 | `pre-2025-06 / full` (`openchronicle-mcp` - pin reverted, see below) |
| control (note block removed) | 22 | `2026-07 / header-add` |
| control | 2 | `unknown / header-add` |
| control | 1 | `pre-2025-06 / full` |

* **`py_compile` green on 25/25** for every touched `.py` file (entry files, note files, wrappers).
* Read the `after` column honestly: the audit tool excludes its own shim (`SELF_FILES`) and does not
  scan `.md`, so the new `protocol-2026-07-28` / `mcp-method-header` / `mcp-name-header` /
  `server-discover` signals are read from the migration-note text in the entry file, and `session-id`
  is prose about the shim *stripping* that header - not session code. Runtime evidence for the wire is
  the `mcp>=2.0.0` pin (2.3.0 speaks 2026-07-28) plus the shim at the ingress; `mcp>=2.0.0` alone is
  not a wire signal for this scanner. **After-rows are note-text-driven until post-merge re-audit.**
* **CI sampled on 4 PRs:**
  * `meok-uae-rta-transport-mcp` #1 - `build` success;
  * `mitre-attack-mcp` #1 - `test (3.10)` / `test (3.11)` / `test (3.12)` all success;
  * `database-universal-mcp` #21 - `CodeQL` + `Analyze (python)` + `test (3.10/3.11/3.12)` success
    - the pin and the `FastMCP -> MCPServer` rename import and run under mcp 2.x;
  * **`openchronicle-mcp` #4 - RED, root-caused, fixed:** `ubuntu-latest` / `macos-latest` /
    `windows-latest` / `lint + format + types` failed with
    `TypeError: MCPServer.__init__() got an unexpected keyword argument 'host'`
    (**29 failed, 41 errors, 316 passed**) - receipt
    <https://github.com/CSOAI-ORG/openchronicle-mcp/actions/runs/37722454245/job/113133007633>.
    The pin + rename were **reverted** on that branch (the pin is worthless if the server cannot be
    constructed), the PR body and `MIGRATION_NOTE.md` now document the blocker with that receipt and
    the unblock recipe (adapt `create_server()` to the mcp 2.x constructor), and the PR diff is back
    to **2 files** (`mcp2026_shim.py` + `MIGRATION_NOTE.md`), verified by
    `GET pulls/4/files` -> exactly those two, and `pyproject.toml` on the branch contains no
    `mcp>=2.0.0`.
* **PR read-back after creation (all 25):** `state: open`, `base: main`, head
  `mcp-2026-wire-header-add`, `changed_files` 4 (16 repos) / 5 (7 repos) / 2 (2 repos).
  **Final pass (end of lane): `GET pulls?head=CSOAI-ORG:mcp-2026-wire-header-add&state=open` on all 25 -> exactly one open PR per repo, `base: main`, 25/25 - no duplicates, none closed.**  
  Body spot-check on 4 PRs (`meok-uae` #1, `openchronicle` #4, `database-universal` #21,
  `digital-human-library` #1): all nine required elements present (class, steps, verify command,
  plan link, 2027-07-28 deadline, before/after/control rows, the honesty line).
* **Default branches untouched (sampled 3):** `GET contents/MIGRATION_NOTE.md?ref=main` -> 404 on
  `meok-uae-rta-transport-mcp`, `openchronicle-mcp`, `digital-human-library`. No push, no force, no
  merge was made by this lane; every write went through `PUT contents` / `POST git/refs` /
  `POST pulls` / `PATCH pulls/<n>` on the `mcp-2026-wire-header-add` branch only.

## 5. Branch pre-existence and the 422-recovery rule

**24 of the 25 repos already had a `mcp-2026-wire-header-add` branch before this lane wrote anything** -
and every one of them was a **stale empty pointer**: `branch_sha == main_sha` (no commits of its own)
and **zero PRs ever opened with that head** (verified with
`GET pulls?head=CSOAI-ORG:mcp-2026-wire-header-add&state=all` on all 25). Only
`digital-human-library` had no branch; this lane created it.

Handling, per the 422-recovery rule:

* Files were classified by git blob SHA against both our bytes and the default-branch bytes:
  `identical` / `missing` / **`untouched main bytes -> our own overwrite, no other lane's work`** /
  `materially different -> SKIP, no force, no second PR`.
* First push attempt classified those 24 as "materially different" and refused (0 writes, 0 PRs) -
  correct conservatism, wrong classification: the differing files were exactly the *unpatched main
  copies* on a branch pinned at main tip. After proving `branch_sha == main_sha` + 0 PRs, they were
  re-classified as our own work and written normally (with the blob `sha` on every `PUT`, never a
  force, never an overwrite of foreign bytes).
* **The 422 rule itself was armed but never fired:** 0 pre-existing PRs, 0 HTTP 422s, 0 second PRs on
  a repo that already had an open `head:mcp-2026-wire-header-add` PR.

## 6. API budget and rate discipline

* **~542 `gh api` calls against the 600 hard cap:** 100 discovery (25 repo meta + 25 recursive trees,
  x2 - the first pass used the system `python3`, whose SSL store is broken on macOS, so all raw
  fetches failed and the pass was re-run under `/opt/homebrew/bin/python3.11`; the API half of both
  passes was spent), 75 branch/PR pre-checks, 129 first push attempt (24 refusals, 1 PR), 176 second
  push attempt (24 PRs), 7 read-back/content checks, 12 CI sampling + job-log diagnosis, 1 python-sdk
  tree lookup, 7 openchronicle revert, ~10 ad-hoc investigation, 25 final open-PR verification (`GET pulls?head=...&state=open` -> exactly one open PR, base `main`, on all 25). Rate-limit probes
  (`gh api rate_limit`, which does not count against the core quota) read **5000/5000** at start.
* 0.30 s pacing between calls, 30 s exponential backoff armed for secondary limits: **0
  secondary-limit hits**. Deterministic HTTP 4xx were never retried.
* **Wall time: ~41 minutes** (02:55 UTC selection -> 03:36 UTC report), inside the 90-minute budget.

## 7. Known gaps carried forward

* **`openchronicle-mcp` (PR #4) is documentation + shim only** - the header-add pin is blocked on an
  mcp 2.x constructor adaptation (`host`/`port`/`streamable_http_path`/`transport_security` no longer
  accepted). It also reads local class `full`, not `header-add`, because of handshake fixtures in
  `tests/` and `scripts/`. Both are written into the PR body and `MIGRATION_NOTE.md`; neither is
  fixed here. Its branch carries **9 commits** (5 original PUTs + 4 revert PUTs) - the diff is the
  correct 2 files; no history rewrite because force-push is forbidden by this lane's rules.
* The `after` audit rows are note-text-driven (section 4): re-audit after merge and after a live
  probe (plan section 6.5) before anyone quotes `migration: none`.
* Static declaration surfaces (`.well-known/*.json`, `server.json`, `manifest.json`, `README.md`,
  `smithery.yaml`) still declare older wires - listed as follow-ups in each `MIGRATION_NOTE.md`, not
  silent-edited (Art. 21: a declaration change gets its own commit).
* The before-era `2026-07` on 22 repos is the `.well-known/*` `mcp_name`-class token, a scanner
  false-positive: those repos are **not** evidence of 2026-07-28 wire support before this branch.
  The census row (`unknown / header-add`) is the honest pre-state.
* 2 repos ship the shim without a packaging include list (`meok-eat-mcp`, `openchronicle-mcp`) - the
  shim is in-tree only there; if the wheel must carry it, that is a follow-up commit.
* The stale `mcp-2026-wire-header-add` pointers on 24 repos came from an earlier interrupted run of
  this wave (no PRs, no commits) - whoever creates branches before content should re-check; this lane
  found them and worked around them without force.
* No git commit in `~/clawd` from this lane - the parent lane commits this report.

## 8. Artifacts

* `MCP_HEADER_ADD_WAVE2_BATCH5_2026-10-08.md` - this report.
* Per repo, on `mcp-2026-wire-header-add`: `mcp2026_shim.py`, `MIGRATION_NOTE.md`, pinned
  `pyproject.toml`, edited entry file (+ `mcp-wrapper.py` on the 7 HTTP repos).
* Scratch (pruned after 24 h): `~/.hermes/cache/scratch/mig5b_{discover,before,patch,audit,note,push,oc_fix}.py`,
  `wave5b_{discovery,before,patch,audits,push,precheck,table,openchronicle_fix}.json/.md`.
* Working trees under `/tmp/mig5b/<repo>/` (4.9 MB total) - removed at lane end.

Report written 2026-10-08 03:36 UTC.
