# MCP header-add migration wave 2, batch 8 (25 PRs)

**Date:** 2026-10-08 - **Lane:** M4 MCP-migration (wave 2, batch 8 of the auto-rolling sequence) - **Status:** complete, 25/25 PRs open
**Runbook:** `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md` section 3 (header-add) + section 4 (the shim as bridge)
**Pattern proven by:** `MCP_HEADER_ADD_WAVE1_2026-10-07.md` (10/10) and `MCP_HEADER_ADD_WAVE2_BATCH1_2026-10-08.md` (25/25) - same branch name, same steps, same verify.
**Scope:** CSOAI-ORG repos only, branch `mcp-2026-wire-header-add`, base = each repo's default branch, no default-branch pushes, no force, no clones (reads via `gh api` + `raw.githubusercontent.com` through `curl`; system Python has no CA certs).
**Deprecation deadline carried in every PR:** the legacy wire dies **2027-07-28**.

## 1. Selection

From `~/.hermes/cache/scratch/mig-batch8-slice.json` - a LIVE-deduped slice of exactly **25 repos**, taken as-is, never substituted. Every one exists, none archived, none a fork -> **0 skips**.
All 25 census rows (`MCP_WIRE_CENSUS_GITHUB_2026-10-07.jsonl`) are `era: unknown / class: header-add`, `fork: false`.

## 2. Results

| # | repo | PR | census era/class | before (local audit) | after (verify) | control | files changed | notes |
|--:|---|---|---|---|---|---|---|---|
| 1 | `insurance-ai` | https://github.com/CSOAI-ORG/insurance-ai/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 3: `mcp2026_shim.py`, `src/index.ts`, `MIGRATION_NOTE.md` | no JS pin invented (`@modelcontextprotocol/sdk` has no 2026-07-28 release); shim + `//` note block in `src/index.ts` |
| 2 | `insurance-verification-mcp` | https://github.com/CSOAI-ORG/insurance-verification-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 3 | `inventory-management-ai-mcp` | https://github.com/CSOAI-ORG/inventory-management-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 4 | `invoice-generator-ai-mcp` | https://github.com/CSOAI-ORG/invoice-generator-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 5 | `ip-network-ai-mcp` | https://github.com/CSOAI-ORG/ip-network-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 6 | `iso-27001-ai-mcp` | https://github.com/CSOAI-ORG/iso-27001-ai-mcp/pull/26 (PR #26) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 7 | `iso-42001-ai-mcp` | https://github.com/CSOAI-ORG/iso-42001-ai-mcp/pull/17 (PR #17) | unknown / header-add | 2025-11 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; **before-era 2025-11 is real**: `mcp-wrapper.py` + `.well-known/mcp/server-card.json` declared `2025-11-25` (no agent-card `mcp_name` token in this repo); control moved to 2026-07 because the wrapper served-card bump is code, not note text |
| 8 | `job-description-ai-mcp` | https://github.com/CSOAI-ORG/job-description-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 9 | `json-ai-mcp` | https://github.com/CSOAI-ORG/json-ai-mcp/pull/18 (PR #18) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 10 | `json-transformer` | https://github.com/CSOAI-ORG/json-transformer/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2: `mcp2026_shim.py`, `MIGRATION_NOTE.md` | package.json-only (no server entry point): shim + MIGRATION_NOTE.md only, no pin invented; after == before by construction |
| 11 | `jwt-ai-mcp` | https://github.com/CSOAI-ORG/jwt-ai-mcp/pull/18 (PR #18) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 12 | `keyword-extractor-ai-mcp` | https://github.com/CSOAI-ORG/keyword-extractor-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 13 | `landlaw-ai-mcp` | https://github.com/CSOAI-ORG/landlaw-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 14 | `law-enforcement-ai` | https://github.com/CSOAI-ORG/law-enforcement-ai/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 3: `mcp2026_shim.py`, `src/index.ts`, `MIGRATION_NOTE.md` | no JS pin invented (`@modelcontextprotocol/sdk` has no 2026-07-28 release); shim + `//` note block in `src/index.ts` |
| 15 | `lead-scoring-ai-mcp` | https://github.com/CSOAI-ORG/lead-scoring-ai-mcp/pull/18 (PR #18) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 16 | `legal-document-ai-mcp` | https://github.com/CSOAI-ORG/legal-document-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 17 | `legal-tech-ai` | https://github.com/CSOAI-ORG/legal-tech-ai/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 3: `mcp2026_shim.py`, `src/index.ts`, `MIGRATION_NOTE.md` | no JS pin invented (`@modelcontextprotocol/sdk` has no 2026-07-28 release); shim + `//` note block in `src/index.ts` |
| 18 | `license-checker-ai-mcp` | https://github.com/CSOAI-ORG/license-checker-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 19 | `linear-issues` | https://github.com/CSOAI-ORG/linear-issues/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2: `mcp2026_shim.py`, `MIGRATION_NOTE.md` | package.json-only (no server entry point): shim + MIGRATION_NOTE.md only, no pin invented; after == before by construction |
| 20 | `linkedin-outreach-mcp` | https://github.com/CSOAI-ORG/linkedin-outreach-mcp/pull/17 (PR #17) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 21 | `llm-compliance-comparison-mcp` | https://github.com/CSOAI-ORG/llm-compliance-comparison-mcp/pull/26 (PR #26) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 22 | `logistics-ai-mcp` | https://github.com/CSOAI-ORG/logistics-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 23 | `lorem-ipsum-ai-mcp` | https://github.com/CSOAI-ORG/lorem-ipsum-ai-mcp/pull/14 (PR #14) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 24 | `maritime-ai` | https://github.com/CSOAI-ORG/maritime-ai/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 3: `mcp2026_shim.py`, `src/index.ts`, `MIGRATION_NOTE.md` | no JS pin invented (`@modelcontextprotocol/sdk` has no 2026-07-28 release); shim + `//` note block in `src/index.ts` |
| 25 | `markdown-ai-mcp` | https://github.com/CSOAI-ORG/markdown-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |

Every PR body carries: class `header-add`, the runbook steps applied, the verify command
`PYTHONPATH= /opt/homebrew/bin/python3.11 ~/clawd/mcp_wire_audit.py audit --local <repo>`, the
before/after/control table, the line **"After-rows are note-text-driven until post-merge re-audit"**,
a link to `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md`, the census row, and the 2027-07-28
deprecation deadline. An automated field scan over all 25 PR bodies found **0 missing fields**.

## 3. What the runbook produced per repo (4 honest groups)

This slice is a mixed family - 19 Python servers, 4 TypeScript servers, 2 package.json-only stubs -
so the batch splits into three diffs; the fourth honest group of the pattern, **py-stdio, has 0 repos
in this slice** (every Python repo here carries an `mcp-wrapper.py` HTTP ingress):

* **py-http (19 repos): `insurance-verification-mcp`, `inventory-management-ai-mcp`, `invoice-generator-ai-mcp`, `ip-network-ai-mcp`, `iso-27001-ai-mcp`, `iso-42001-ai-mcp`, `job-description-ai-mcp`, `json-ai-mcp`, `jwt-ai-mcp`, `keyword-extractor-ai-mcp`, `landlaw-ai-mcp`, `lead-scoring-ai-mcp`, `legal-document-ai-mcp`, `license-checker-ai-mcp`, `linkedin-outreach-mcp`, `llm-compliance-comparison-mcp`, `logistics-ai-mcp`, `lorem-ipsum-ai-mcp`, `markdown-ai-mcp`**
  `pyproject.toml`: `"mcp>=1.0.0"` -> `"mcp>=2.0.0"` on a real dependency line (none invented) +
  `only-include` list gained `"mcp2026_shim.py"` so the shim ships in the wheel;
  `server.py`: `from mcp.server.fastmcp import FastMCP` -> `from mcp.server.mcpserver import MCPServer as FastMCP`
  (forced companion rename - `mcp.server.fastmcp` raises `ModuleNotFoundError` by design in mcp 2.x)
  + migration-note block; `mcp-wrapper.py`: `transport="streamable-http"` ingress rewired to
  `ShimASGI(mcp_server.streamable_http_app(json_response=True))` with served cards
  2025-11-25 -> 2026-07-28; `mcp2026_shim.py` vendored; `MIGRATION_NOTE.md`. **5 files each.**
* **py-stdio (0 repos):** none in this slice - stated rather than padded. (The group stays in the
  pattern for batches that contain a Python server with no HTTP wrapper: pin + rename + note block +
  `http_app()` enable path, `headers N/A at runtime`, 4 files.)
* **TS (4 repos): `insurance-ai`, `law-enforcement-ai`, `legal-tech-ai`, `maritime-ai`**
  `package.json` pins `@modelcontextprotocol/sdk` - **left untouched**: no release of that SDK
  speaks 2026-07-28 and inventing a JS pin is forbidden (wave-1 rule). `mcp2026_shim.py` vendored as
  the reference middleware + `//` migration-note block above `async function main()` in `src/index.ts`
  (stdio `StdioServerTransport`, headers N/A at runtime, JS-pin gap stated in code) + `MIGRATION_NOTE.md`.
  **3 files each.**
* **package.json-only stubs (2 repos): `json-transformer`, `linear-issues`**
  the tree is 5 blobs (`package.json`, `README.md`, `LICENSE`, `.gitignore`, `.github/FUNDING.yml`) -
  there is **no server entry point at all** (the declared `dist/index.js` is not in the repository).
  No pin exists to move (JS or Python), so this branch delivers exactly what the hard rule allows:
  vendored `mcp2026_shim.py` + an honest `MIGRATION_NOTE.md`. Nothing executable changed.
  **2 files each.**
* **JS:** no `@modelcontextprotocol/sdk` pin was changed anywhere in this batch - wave-1 rule: no
  JS SDK release speaks 2026-07-28, so any JS pin would be invented.

## 4. Verification receipts

Local audits ran against fully reconstructed trees (every scannable file of the default branch's
`git/trees` listing, fetched via raw.githubusercontent), before patching, after patching, and with
the migration-note text deleted (control):

| state | repos | reading |
|---|---|---|
| before | 18 | `2026-07 / header-add` - the `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (registry token, known false-positive class), **not** wire code |
| before | 1 | `2025-11 / header-add` (`iso-42001-ai-mcp`) - **real declaration-era**: `mcp-wrapper.py` line 33/62 and `.well-known/mcp/server-card.json` declared `2025-11-25`; this repo has no agent-card `mcp_name` token, so the scanner read the actual declaration |
| before | 6 | `unknown / header-add` (4 TS + 2 stubs) - the census's honest pre-state |
| **after (this branch)** | **23** | **`2026-07 / handshake-removal`** (19 Python + 4 TypeScript - note-text driven) |
| after (this branch) | 2 | `unknown / header-add` unchanged - package.json-only repos: no scanned surface changed (shim self-excluded, `.md` not scanned, `package.json` deliberately untouched) |
| control (note text removed) | 19 | `2026-07 / header-add` (18 agent-card false-positive + `iso-42001-ai-mcp`) |
| control (note text removed) | 6 | `unknown / header-add` - control == before on 24 of 25; the single exception is `iso-42001-ai-mcp` (see below) |

Read the `after` rows honestly: the audit tool excludes its own shim (`SELF_FILES`) and does not
scan `.md`, so the new `protocol-2026-07-28` / `mcp-method-header` / `mcp-name-header` /
`server-discover` signals are read from the migration-note text (Python comment block / TS comment
block), and `session-id` is prose about the shim *stripping* that header. Runtime evidence for the
wire is the `mcp>=2.0.0` pin (2.3.0 speaks 2026-07-28) plus the shim at the ingress; `mcp>=2.0.0`
alone is not a wire signal for this scanner. **After-rows are note-text-driven until post-merge
re-audit.** The 2 stub rows do not move at all - that is the honest reading, not a pass.

* **`iso-42001-ai-mcp` control is the one row that differs from before** (`2025-11` -> `2026-07`):
  the control run removes only the migration-note block, and the `mcp-wrapper.py` served-card bump
  (2025-11-25 -> 2026-07-28) is executable code, not note text. The migration class stays
  `header-add` in control, i.e. the row moved era but not class - provenance still holds for the
  `handshake-removal` after-row, which only the note text can produce.
* **CI sampled on 4 PRs (all green where checks exist):** `insurance-verification-mcp`
  `test (3.10)` / `test (3.11)` / `test (3.12)` pass + Cursor checks success/neutral;
  `iso-42001-ai-mcp` `test (3.10)` / `test (3.11)` / `test (3.12)` pass + `CodeQL` pass +
  `Analyze (python) (python)` pass + `dependabot` skipped (1 Cursor check still `in_progress`);
  `insurance-ai` and `json-transformer` Cursor checks success/neutral, none failing - the pin and
  the `FastMCP -> MCPServer` rename import and run under mcp 2.x.
* **PR read-back after creation (all 25):** `state: open`, `base: main`, head
  `mcp-2026-wire-header-add`, `changed_files` 5 (19 py-http) / 3 (4 TS) / 2 (2 stubs), `commits`
  equal to the file count on every PR.
* **Independent second read-back (all 25, one call each):** every body field verified present -
  class `header-add`, deadline `2027-07-28`, plan link, verify command, before/after/control rows,
  the caveat line `After-rows are note-text-driven until post-merge re-audit`, title prefix
  `MCP 2026-07-28 wire: header-add` - **0 missing fields**.
* **Default branches untouched (sampled 5):** `GET contents/MIGRATION_NOTE.md?ref=main` -> 404 on
  `insurance-ai`, `insurance-verification-mcp`, `json-transformer`, `linear-issues`, `maritime-ai`.
  No push, no force, no merge was made by this lane; every write went through `POST git/refs` /
  `PUT contents` / `POST pulls` on the `mcp-2026-wire-header-add` branch only.
* **422 rule:** implemented pre-emptively - every repo was checked
  (`GET pulls?state=open&head=CSOAI-ORG:mcp-2026-wire-header-add`) **before any write**, and branch
  content was verified byte-identical (git blob SHA1 of local files vs branch tree) before any body
  re-PATCH. No pre-existing PR and no foreign branch content was found in this slice:
  **0 pre-existing PRs, 0 re-PATCHes, 0 content-conflict skips, 0 second PRs.**

## 5. API budget and rate discipline

* **~383 `gh api` calls against the 600 hard cap:** 50 discovery (25 repo meta + 25 recursive
  trees), 286 in the push pass (25 PR pre-checks + branch/tree verification + head refs + branch
  POSTs + PUTs + PRs + read-backs), 25 independent body read-backs, 13 default-branch 404 checks
  (4 of them mis-routed probe calls that returned 422 and were re-issued correctly), 8 CI reads.
  `gh api rate_limit` probes (no core-quota cost) read 5000/5000 at start and before the push pass.
* 0.30 s pacing between calls, 30 s exponential backoff armed for secondary limits: **0
  secondary-limit hits**. Deterministic HTTP 4xx are not retried.
* **Wall time: ~28 minutes** (03:27 UTC rate probe -> 03:55 UTC report), well inside the 90-minute
  budget.
* One aborted start is recorded rather than hidden: the first push launch died before Python ran
  because `gh api rate_limit` returned `EOF` on a transient network blip (`&&` short-circuited); it
  cost 1 failed call and ~4 minutes of wall time, no writes, and was relaunched cleanly.

## 6. Known gaps carried forward

* The `after` audit rows for the 23 note-bearing repos are note-text-driven: re-audit after merge
  and after a live probe (plan section 6.5) before anyone quotes `migration: none`. The 2 stub
  rows stay `unknown / header-add` until those repositories get a real entry point.
* `insurance-ai`, `law-enforcement-ai`, `legal-tech-ai`, `maritime-ai`: the TS servers themselves
  still do not implement the four runbook duties - the branch delivers the comment record +
  reference shim only, because no `@modelcontextprotocol/sdk` release speaks 2026-07-28 (follow-up
  stated in all four `MIGRATION_NOTE.md` files).
* The before-era `2026-07` on 18 Python repos is the `.well-known/agent-card.json` `"mcp_name"`
  token, a scanner false-positive: those repos are **not** evidence of 2026-07-28 wire support
  before this branch. The census row (`unknown / header-add`) is the honest pre-state.
  `iso-42001-ai-mcp` is the opposite: its `2025-11` before-row is a real declaration in
  `mcp-wrapper.py` / `.well-known/mcp/server-card.json`.
* Static declaration surfaces (`.well-known/*.json`, `server.json`, `manifest.json`, `README.md`)
  still declare older wires - listed as follow-ups in each `MIGRATION_NOTE.md`, not silent-edited
  (Art. 21: a declaration change gets its own commit).
* No py-stdio repo in this slice (section 3) - the group is reported as 0, not merged into py-http.
* No git commit in `~/clawd` from this lane - the parent lane commits this report.

## 7. Artifacts

* `MCP_HEADER_ADD_WAVE2_BATCH8_2026-10-08.md` - this report.
* Per repo, on `mcp-2026-wire-header-add`: `mcp2026_shim.py`, `MIGRATION_NOTE.md`, pinned
  `pyproject.toml`, edited `server.py`, rewired `mcp-wrapper.py` (19 py-http);
  + `src/index.ts` on the 4 TS repos; the 2 stubs ship only the shim + note.
* Scratch (pruned after 24 h): `~/.hermes/cache/scratch/m8_{discover,before,patch,audit,note,push,readback}.py`,
  `m8_{discovery,before,patch,audits,push,readback,verify}.json`, `m8_table.md`, `m8_rows.json`,
  `m8_push.log`. Reconstructed trees under `/tmp/mig8b/` removed on lane exit.
