# MCP header-add migration wave 2, batch 9 (25 PRs)

**Date:** 2026-10-08 - **Lane:** M4 MCP-migration (wave 2, batch 9 of the auto-rolling sequence) - **Status:** complete, 25/25 PRs open
**Runbook:** `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md` section 3 (header-add) + section 4 (the shim as bridge)
**Pattern proven by:** `MCP_HEADER_ADD_WAVE1_2026-10-07.md` (10/10), `MCP_HEADER_ADD_WAVE2_BATCH1_2026-10-08.md` (25/25) and `MCP_HEADER_ADD_WAVE2_BATCH7_2026-10-08.md` (25/25) - same branch name, same steps, same verify, same four honest groups.
**Scope:** CSOAI-ORG repos only, branch `mcp-2026-wire-header-add`, base = each repo's default branch, no default-branch pushes, no force, no clones (reads via `gh api` + `raw.githubusercontent.com` through `curl`; system Python has no CA certs).
**Deprecation deadline carried in every PR:** the legacy wire dies **2027-07-28**.

## 1. Selection

From `~/.hermes/cache/scratch/mig-batch9-slice.json` - a LIVE-deduped slice of exactly **25 repos**, taken as-is, never substituted. Every one exists, none archived, none a fork -> **0 skips**.
All 25 census rows (`MCP_WIRE_CENSUS_GITHUB_2026-10-07.jsonl`) are `era: unknown / class: header-add`. The slice was cut by the coordinator from `mig-live-remaining.json` (219 rows at slice time, 03:43 UTC); this lane does not re-derive the remaining pool - sibling batches consume from it concurrently.

## 2. Results

| # | repo | PR | census era/class | before (local audit) | after (verify) | control | files | notes |
--:|---|---|---|---|---|---|---|---|
| 1 | `marketing-analytics-ai-mcp` | https://github.com/CSOAI-ORG/marketing-analytics-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 2 | `math-solver-ai-mcp` | https://github.com/CSOAI-ORG/math-solver-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 3 | `meal-planner-ai-mcp` | https://github.com/CSOAI-ORG/meal-planner-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 4 | `media-ads-ai` | https://github.com/CSOAI-ORG/media-ads-ai/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2 | package.json-only (no server entry point): shim + honest note only; 2 files; after == before by construction |
| 5 | `media-advertising-ai` | https://github.com/CSOAI-ORG/media-advertising-ai/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 3 | no JS pin invented (`@modelcontextprotocol/sdk` has no 2026-07-28 release); shim vendored + `//` note block in `src/index.ts`; 3 files; TS note-block insertion defect (`async function main())`) caught by Cursor Bugbot and repaired on the branch (`ec5915391b`) - file is now `main` + comment block only |
| 6 | `meditation-guide-ai-mcp` | https://github.com/CSOAI-ORG/meditation-guide-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 7 | `meeting-summarizer-ai-mcp` | https://github.com/CSOAI-ORG/meeting-summarizer-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 8 | `memory-graph` | https://github.com/CSOAI-ORG/memory-graph/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2 | package.json-only (no server entry point): shim + honest note only; 2 files; after == before by construction |
| 9 | `memory-search-mcp` | https://github.com/CSOAI-ORG/memory-search-mcp/pull/18 (PR #18) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 10 | `mining-ai` | https://github.com/CSOAI-ORG/mining-ai/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 3 | no JS pin invented (`@modelcontextprotocol/sdk` has no 2026-07-28 release); shim vendored + `//` note block in `src/index.ts`; 3 files; TS note-block insertion defect (`async function main())`) caught by Cursor Bugbot and repaired on the branch (`1e5e098137`) - file is now `main` + comment block only |
| 11 | `mock-server-ai-mcp` | https://github.com/CSOAI-ORG/mock-server-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 12 | `mortgage-calculator-ai-mcp` | https://github.com/CSOAI-ORG/mortgage-calculator-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 13 | `muckaway-ai-mcp` | https://github.com/CSOAI-ORG/muckaway-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.28.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 14 | `music-production-ai-mcp` | https://github.com/CSOAI-ORG/music-production-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 15 | `note-taking-ai-mcp` | https://github.com/CSOAI-ORG/note-taking-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 16 | `notification-ai-mcp` | https://github.com/CSOAI-ORG/notification-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 17 | `notion-workspace` | https://github.com/CSOAI-ORG/notion-workspace/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2 | package.json-only (no server entry point): shim + honest note only; 2 files; after == before by construction |
| 18 | `nutrition-tracker-ai-mcp` | https://github.com/CSOAI-ORG/nutrition-tracker-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 19 | `oneos-education` | https://github.com/CSOAI-ORG/oneos-education/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 3 | no JS pin invented (`@modelcontextprotocol/sdk` has no 2026-07-28 release); shim vendored + `//` note block in `src/index.ts`; 3 files; TS note-block insertion defect (`async function main())`) caught by Cursor Bugbot and repaired on the branch (`02bcbcfe21`) - file is now `main` + comment block only |
| 20 | `openmcp` | https://github.com/CSOAI-ORG/openmcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; `server.py` runs `mcp.run(transport="streamable-http")` itself - note states that path is shim-less; `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class); CI `e2e` failure is pre-existing on main (identical `ImportError` in `tests/e2e_server.py`, run 2026-09-04) |
| 21 | `otp-ai-mcp` | https://github.com/CSOAI-ORG/otp-ai-mcp/pull/14 (PR #14) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 22 | `owasp-agentic-mcp` | https://github.com/CSOAI-ORG/owasp-agentic-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; stdio-only: headers N/A at runtime; `http_app()` enable path + note; 4 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 23 | `password-ai-mcp` | https://github.com/CSOAI-ORG/password-ai-mcp/pull/18 (PR #18) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 24 | `patient-safety-ai-mcp` | https://github.com/CSOAI-ORG/patient-safety-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 25 | `pci-dss-mcp` | https://github.com/CSOAI-ORG/pci-dss-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; stdio-only: headers N/A at runtime; `http_app()` enable path + note; 4 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |

Every PR body carries: class `header-add`, the runbook steps applied, the verify command
`PYTHONPATH= /opt/homebrew/bin/python3.11 ~/clawd/mcp_wire_audit.py audit --local <repo>`, the
before/after/control table, the line **"After-rows are note-text-driven until post-merge re-audit"**,
a link to `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md`, the census row, and the 2027-07-28
deprecation deadline.

## 3. What the runbook produced per repo (4 groups)

This slice is a mixed family - 19 Python servers, 3 TypeScript servers, 3 package.json-only
stubs - so the batch splits into four diffs:

* **py-http (17 repos): `marketing-analytics-ai-mcp`, `math-solver-ai-mcp`, `meal-planner-ai-mcp`, `meditation-guide-ai-mcp`, `meeting-summarizer-ai-mcp`, `memory-search-mcp`, `mock-server-ai-mcp`, `mortgage-calculator-ai-mcp`, `muckaway-ai-mcp`, `music-production-ai-mcp`, `note-taking-ai-mcp`, `notification-ai-mcp`, `nutrition-tracker-ai-mcp`, `openmcp`, `otp-ai-mcp`, `password-ai-mcp`, `patient-safety-ai-mcp`**
  `pyproject.toml`: `"mcp>=1.0.0"` -> `"mcp>=2.0.0"` on a real dependency line (none invented;
  `muckaway-ai-mcp` was `"mcp>=1.28.0"` -> `"mcp>=2.0.0"`) + `only-include` list gained
  `"mcp2026_shim.py"` so the shim ships in the wheel; `server.py`:
  `from mcp.server.fastmcp import FastMCP` -> `from mcp.server.mcpserver import MCPServer as FastMCP`
  (forced companion rename - `mcp.server.fastmcp` raises `ModuleNotFoundError` by design in mcp 2.x,
  re-verified against the SDK v2.3.0 source) + migration-note block;
  `mcp-wrapper.py`: `transport="streamable-http"` ingress rewired to
  `ShimASGI(mcp_server.streamable_http_app(json_response=True))` with served cards
  2025-11-25 -> 2026-07-28; `mcp2026_shim.py` vendored; `MIGRATION_NOTE.md`. **5 files each.**
  One special case inside the group: **`openmcp`** serves HTTP from `server.py` itself
  (`mcp.run(transport="streamable-http")`, entry `def main() -> None:`), so its note block says
  plainly that the direct path has **no shim in it** and must be fronted before exposure -
  the wrapper is still wired. Its pre-existing CI gap is in section 4.
* **py-stdio (2 repos): `owasp-agentic-mcp`, `pci-dss-mcp`**
  same pin + rename + include-list edit, no `mcp-wrapper.py` exists, so `server.py` got the note
  block plus the `http_app()` enable path (`ShimASGI(mcp.streamable_http_app(json_response=True))`)
  and the note states `headers N/A at runtime`. **4 files each.**
* **TS (3 repos): `media-advertising-ai`, `mining-ai`, `oneos-education`**
  `package.json` pins `@modelcontextprotocol/sdk` - **left untouched**: no release of that SDK
  speaks 2026-07-28 and inventing a JS pin is forbidden (wave-1 rule). `mcp2026_shim.py` vendored as
  the reference middleware + `//` migration-note block above `async function main()` in `src/index.ts`
  (stdio `StdioServerTransport`, headers N/A at runtime, JS-pin gap stated in code) +
  `MIGRATION_NOTE.md`. **3 files each.**
* **package.json-only stubs (3 repos): `media-ads-ai`, `memory-graph`, `notion-workspace`**
  the tree is 5 blobs (package.json, README, LICENSE, .gitignore, .github/FUNDING.yml) - there is
  **no server entry point at all** (the declared `dist/index.js` is not in the repository). No pin
  exists to move (JS or Python), so this branch delivers exactly what the hard rule allows: vendored
  `mcp2026_shim.py` + an honest `MIGRATION_NOTE.md`. Nothing executable changed. **2 files each.**
* **JS:** no `@modelcontextprotocol/sdk` pin was changed anywhere in this batch - wave-1 rule: no
  JS SDK release speaks 2026-07-28, so any JS pin would be invented.

## 4. Verification receipts

Local audits ran against fully reconstructed trees (every scannable file of the default branch's
`git/trees` listing, fetched via raw.githubusercontent), before patching, after patching, and with
the migration-note text deleted (control):

| state | repos | reading |
|---|---|---|
| before | 19 | `2026-07 / header-add` - the `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (registry token, known false-positive class; all 19 carry `mcp-name-header`), **not** wire code |
| before | 6 | `unknown / header-add` (3 TS + 3 stubs) - the census's honest pre-state |
| **after (this branch)** | **22** | **`2026-07 / handshake-removal`** (19 Python + 3 TypeScript - note-text driven) |
| after (this branch) | 3 | `unknown / header-add` unchanged - package.json-only repos: no scanned surface changed (shim self-excluded, `.md` not scanned, `package.json` deliberately untouched) |
| control (note text removed) | 19 | `2026-07 / header-add` |
| control (note text removed) | 6 | `unknown / header-add` - control == before on all 25, which is the provenance proof |

Read the `after` rows honestly: the audit tool excludes its own shim (`SELF_FILES`) and does not
scan `.md`, so the new `protocol-2026-07-28` / `mcp-method-header` / `mcp-name-header` /
`server-discover` signals are read from the migration-note text (Python comment block / TS comment
block), and `session-id` is prose about the shim *stripping* that header. Runtime evidence for the
wire is the `mcp>=2.0.0` pin (2.3.0 speaks 2026-07-28) plus the shim at the ingress;
`mcp>=2.0.0` alone is not a wire signal for this scanner. **After-rows are note-text-driven until
post-merge re-audit.** The 3 stub rows do not move at all - that is the honest reading, not a pass.

Two claims in the recipe were re-verified against the SDK source rather than assumed:
`streamable_http_app(*, json_response, host, ...)` accepts exactly the arguments the wrapper now
passes, and `mcp.server.fastmcp` really does raise `ModuleNotFoundError` by design (`"FastMCP is
now mcp.server.mcpserver.MCPServer"`).

* **CI sampled on 4 PRs:** `marketing-analytics-ai-mcp` `test (3.10/3.11/3.12)` pass;
  `owasp-agentic-mcp` `test (3.10/3.11/3.12)` pass; `mining-ai` (TS) Cursor checks
  success/neutral, none failing; `openmcp` `test (3.10/3.11/3.12)` pass **but its
  `e2e (boot streamable-http server + call every tool)` check is red - and it is red on `main`
  too**: the last main push (run 33874103541, 2026-09-04) fails with the identical
  `ImportError: cannot import name 'streamablehttp_client'` in `tests/e2e_server.py:33`.
  The pin did not change what CI installs (`mcp>=1.0.0` already resolves to 2.x), so this is a
  pre-existing gap, recorded here rather than smoothed over.
* **PR read-back after creation (all 25):** `state: open`, `base: main`, head
  `mcp-2026-wire-header-add`, `changed_files` 5 (17 py-http) / 4 (2 py-stdio) / 3 (3 TS) /
  2 (3 stubs), and `commits` equals `changed_files` on every repo at creation - one commit per
  file, no interrupted-run debris (the three TS repos now read 4 commits each: their repair is a
  second commit on the same branch, see the defect bullet below).
* **Independent body read-back (all 25):** nine required fields checked per body - class
  `header-add` heading, 2027-07-28 deadline, plan link, verify command, before row, after row,
  control row, the caveat line, and the census row. **25/25 present on every PR** (the first pass
  of this check used a wrong needle string for the census line; re-reading a body confirmed
  `**Census row:** era ...` is present - the tooling slip, not a body gap, is reported here).
* **Defect found and repaired on this branch (TS group):** Cursor Bugbot flagged
  `async function main())` in the three TS PRs - the note-block insertion left one stray `)` after
  the signature (`tsblock` already ended with `async function main()`, and the remaining slice
  started at the original `)`). **Caught after the PRs opened, fixed before this report:** each
  `src/index.ts` was re-fetched from the branch, the stray paren removed, and the file re-PUT
  (`media-advertising-ai` ec5915391b, `mining-ai` 1e5e098137, `oneos-education` 02bcbcfe21).
  Post-fix verification: the defect string is gone, exactly one `async function main() {` remains,
  the banner appears once, and stripping the comment block reproduces the `main` file byte for
  byte - so the branch now changes `src/index.ts` by the comment block only. PRs stayed open,
  base `main`, 3 changed files (4 commits each - the repair is a second commit, no force, no
  second PR). **All three were red for any TypeScript build before this repair**; the py and stub
  groups never touch `async function main` and are unaffected.
* **Default branches untouched (sampled 5, one per group):** `GET contents/MIGRATION_NOTE.md`
  -> 404 on `openmcp`, `owasp-agentic-mcp`, `media-advertising-ai`, `media-ads-ai`, `pci-dss-mcp`.
  No push, no force, no merge was made by this lane; every write went through `POST git/refs` /
  `PUT contents` / `POST pulls` on the `mcp-2026-wire-header-add` branch only.
* **422 rule:** implemented pre-emptively - every repo was checked for an open PR with head
  `mcp-2026-wire-header-add` **before any write**, and branch content was verified byte-identical
  (git blob SHA-1 of local files vs branch tree) before any body re-PATCH. No pre-existing PR and
  no foreign branch content was found in this slice: **0 pre-existing PRs, 0 re-PATCHes,
  0 content-conflict skips.**
* **Local syntax gate:** all 123 Python files in the 25 reconstructed trees (including every
  patched `server.py` / `mcp-wrapper.py`) compile clean under `py_compile` before any push.

## 5. API budget and rate discipline

* **421 `gh api` calls against the 600 hard cap:** 50 discovery (25 repo meta + 25 recursive
  trees), 283 in the push pass (25 PR pre-checks, ref creation, branch + base trees,
  108 `PUT contents`, 25 `POST pulls`, 25 read-backs), 38 verification reads (25 body read-backs,
  5 default-branch 404s, 8 CI reads), 8 follow-up reads on the `openmcp` e2e failure, 1 sample
  body read, 20 on the TS repair (3 branch fetches, 3 `main` fetches, 3 repair `PUT`s, 11
  read-backs), 1 read on `gaming-ai`, 16 failed `gh api` attempts during a ~40 s `api.github.com`
  connectivity blip (retried, 0 data loss), 4 cross-lane reads on batch 8's TS PRs.
  `gh api rate_limit` probes (no core-quota cost) read 5000/5000 at start and before the push.
  One unauthenticated `api.github.com` tags read (SDK source location) sat outside the `gh` core
  quota; it is counted here for completeness.
* 0.30 s pacing between calls, 30 s exponential backoff armed for secondary limits: **0
  secondary-limit hits, 0 retries, 0 budget skips.**
* **Wall time: ~38 minutes** (03:29 UTC selection -> 04:07 UTC report), well inside the 90-minute
  budget.

## 6. Known gaps carried forward

* **Template defect, cross-lane (found while fixing the above):** the note-block insertion line
  in the shared patch script is wrong in the copies used by batch 8 (`m8_patch.py`) and the not-yet-run
  batches 11-13 (`m11_patch.py`, `m12_patch.py`, `m13_patch.py`); batch 10's copy (`m10_patch.py`)
  is corrected. Read-only evidence: **batch 7's two TS PRs are clean** (`gaming-ai`,
  `healthcare-ai`, 2/2 checked) while **batch 8's four TS PRs all carry the defect**
  (`insurance-ai`, `law-enforcement-ai`, `legal-tech-ai`, `maritime-ai`, 4/4 checked). This lane
  repaired only its own three - batch 8's branches were not written to (outside this slice), so
  they are reported here for the coordinating lane. Batches 11-13 should correct their script
  before they run.
* `openmcp` CI `e2e` is red on this branch **and on `main`** (identical `ImportError`,
  `tests/e2e_server.py:33` - the test client is written against the mcp 1.x client API). Fixing
  that test is outside the header-add runbook; it is stated here rather than hidden.
* `openmcp` `server.py` runs `mcp.run(transport="streamable-http")` directly - that path has no
  shim in it. The note block says so; the follow-up (stated in its `MIGRATION_NOTE.md`) is to
  front it with `ShimASGI` before it is exposed.
* The `after` audit rows for the 22 note-bearing repos are note-text-driven: re-audit after merge
  and after a live probe (plan section 6.5) before anyone quotes `migration: none`. The 3 stub
  rows stay `unknown / header-add` until those repositories get a real entry point.
* The 3 TS servers themselves still do not implement the four runbook duties - the branch
  delivers the comment record + reference shim only, because no `@modelcontextprotocol/sdk`
  release speaks 2026-07-28 (follow-up stated in all three `MIGRATION_NOTE.md` files).
* The before-era `2026-07` on the 19 Python repos is the `.well-known/agent-card.json` `"mcp_name"`
  token, a scanner false-positive: those repos are **not** evidence of 2026-07-28 wire support
  before this branch. The census row (`unknown / header-add`) is the honest pre-state.
* Static declaration surfaces (`.well-known/*.json`, `server.json`, `manifest.json`, `README.md`)
  still declare older wires - listed as follow-ups in each `MIGRATION_NOTE.md`, not silent-edited
  (Art. 21: a declaration change gets its own commit).
* The remaining eligible pool is owned by the coordinator (`mig-live-remaining.json`, 219 rows at
  slice time); this lane neither claims nor burns any of it beyond its 25.
* No git commit in `~/clawd` from this lane - the parent lane commits this report.

## 7. Artifacts

* `MCP_HEADER_ADD_WAVE2_BATCH9_2026-10-08.md` - this report.
* Per repo, on `mcp-2026-wire-header-add`: `mcp2026_shim.py`, `MIGRATION_NOTE.md`, pinned
  `pyproject.toml`, edited `server.py` (+ `mcp-wrapper.py` on the 17 HTTP repos;
  + `src/index.ts` on the 3 TS repos).
* Scratch (pruned after 24 h): `~/.hermes/cache/scratch/m9_*.py` (discover, before, patch, audit,
  note, push, verify), `m9_*.json`, `m9_push.log`, `m9_table.md`, `m9_groups.json`.
  Reconstructed trees under `/tmp/mig9b/` removed on lane exit.
