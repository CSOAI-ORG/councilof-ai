# MCP header-add migration wave 2, batch 7 (25 PRs)

**Date:** 2026-10-08 - **Lane:** M4 MCP-migration (wave 2, batch 7 of the auto-rolling sequence) - **Status:** complete, 25/25 PRs open
**Runbook:** `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md` section 3 (header-add) + section 4 (the shim as bridge)
**Pattern proven by:** `MCP_HEADER_ADD_WAVE1_2026-10-07.md` (10/10) and `MCP_HEADER_ADD_WAVE2_BATCH1_2026-10-08.md` (25/25) - same branch name, same steps, same verify.
**Scope:** CSOAI-ORG repos only, branch `mcp-2026-wire-header-add`, base = each repo's default branch, no default-branch pushes, no force, no clones (reads via `gh api` + `raw.githubusercontent.com` through `curl`; system Python has no CA certs).
**Deprecation deadline carried in every PR:** the legacy wire dies **2027-07-28**.

## 1. Selection

From `~/.hermes/cache/scratch/mig-batch7-slice.json` - a LIVE-deduped slice of exactly **25 repos**, taken as-is, never substituted. Every one exists, none archived, none a fork -> **0 skips**.
All 25 census rows (`MCP_WIRE_CENSUS_GITHUB_2026-10-07.jsonl`) are `era: unknown / class: header-add`.

## 2. Results

| # | repo | PR | census era/class | before (local audit) | after (verify) | control | files changed | notes |
--:|---|---|---|---|---|---|---|---|
| 1 | `fitness-ai-mcp` | https://github.com/CSOAI-ORG/fitness-ai-mcp/pull/20 (PR #20) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 2 | `flashcard-ai-mcp` | https://github.com/CSOAI-ORG/flashcard-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 3 | `flight-logger-mcp` | https://github.com/CSOAI-ORG/flight-logger-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 4 | `focus-timer-ai-mcp` | https://github.com/CSOAI-ORG/focus-timer-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 5 | `gaming-ai` | https://github.com/CSOAI-ORG/gaming-ai/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 3: `mcp2026_shim.py`, `src/index.ts`, `MIGRATION_NOTE.md` | no JS pin invented (`@modelcontextprotocol/sdk` has no 2026-07-28 release); shim vendored + `//` note block in `src/index.ts`; 3 files |
| 6 | `gardening-ai-mcp` | https://github.com/CSOAI-ORG/gardening-ai-mcp/pull/17 (PR #17) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 7 | `git-helper-ai-mcp` | https://github.com/CSOAI-ORG/git-helper-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 8 | `git-operations` | https://github.com/CSOAI-ORG/git-operations/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2: `mcp2026_shim.py`, `MIGRATION_NOTE.md` | package.json-only (no server entry point): shim + MIGRATION_NOTE.md only, no pin invented; 2 files; after == before by construction |
| 9 | `github-api` | https://github.com/CSOAI-ORG/github-api/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2: `mcp2026_shim.py`, `MIGRATION_NOTE.md` | package.json-only (no server entry point): shim + MIGRATION_NOTE.md only, no pin invented; 2 files; after == before by construction |
| 10 | `gitlab-api` | https://github.com/CSOAI-ORG/gitlab-api/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2: `mcp2026_shim.py`, `MIGRATION_NOTE.md` | package.json-only (no server entry point): shim + MIGRATION_NOTE.md only, no pin invented; 2 files; after == before by construction |
| 11 | `gods-eye-geospatial-mcp` | https://github.com/CSOAI-ORG/gods-eye-geospatial-mcp/pull/7 (PR #7) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; stdio-only: `http_app()` enable path + note; 4 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 12 | `google-drive` | https://github.com/CSOAI-ORG/google-drive/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2: `mcp2026_shim.py`, `MIGRATION_NOTE.md` | package.json-only (no server entry point): shim + MIGRATION_NOTE.md only, no pin invented; 2 files; after == before by construction |
| 13 | `grammar-fix-ai-mcp` | https://github.com/CSOAI-ORG/grammar-fix-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 14 | `habit-tracker-ai-mcp` | https://github.com/CSOAI-ORG/habit-tracker-ai-mcp/pull/18 (PR #18) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 15 | `hash-utils-ai-mcp` | https://github.com/CSOAI-ORG/hash-utils-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 16 | `health-check-ai-mcp` | https://github.com/CSOAI-ORG/health-check-ai-mcp/pull/18 (PR #18) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 17 | `healthcare-ai` | https://github.com/CSOAI-ORG/healthcare-ai/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 3: `mcp2026_shim.py`, `src/index.ts`, `MIGRATION_NOTE.md` | no JS pin invented (`@modelcontextprotocol/sdk` has no 2026-07-28 release); shim vendored + `//` note block in `src/index.ts`; 3 files |
| 18 | `healthcare-ai-governance-mcp` | https://github.com/CSOAI-ORG/healthcare-ai-governance-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 19 | `healthcare-fhir-mcp` | https://github.com/CSOAI-ORG/healthcare-fhir-mcp/pull/2 (PR #2) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 20 | `hipaa-compliance-mcp` | https://github.com/CSOAI-ORG/hipaa-compliance-mcp/pull/3 (PR #3) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 21 | `html-parser-ai-mcp` | https://github.com/CSOAI-ORG/html-parser-ai-mcp/pull/18 (PR #18) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 22 | `hydration-reminder-ai-mcp` | https://github.com/CSOAI-ORG/hydration-reminder-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 23 | `icon-generator-ai-mcp` | https://github.com/CSOAI-ORG/icon-generator-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 24 | `image-metadata-ai-mcp` | https://github.com/CSOAI-ORG/image-metadata-ai-mcp/pull/20 (PR #20) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; 5 files; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) |
| 25 | `incident-response` | https://github.com/CSOAI-ORG/incident-response/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2: `mcp2026_shim.py`, `MIGRATION_NOTE.md` | package.json-only (no server entry point): shim + MIGRATION_NOTE.md only, no pin invented; 2 files; after == before by construction |

Every PR body carries: class `header-add`, the runbook steps applied, the verify command
`PYTHONPATH= /opt/homebrew/bin/python3.11 ~/clawd/mcp_wire_audit.py audit --local <repo>`, the
before/after/control table, the line **"After-rows are note-text-driven until post-merge re-audit"**,
a link to `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md`, the census row, and the 2027-07-28
deprecation deadline.

## 3. What the runbook produced per repo (4 groups)

This slice is a mixed family - 18 Python servers, 2 TypeScript servers, 5 package.json-only
stubs - so the batch splits into four diffs:

* **py-http (17 repos): `fitness-ai-mcp`, `flashcard-ai-mcp`, `flight-logger-mcp`, `focus-timer-ai-mcp`, `gardening-ai-mcp`, `git-helper-ai-mcp`, `grammar-fix-ai-mcp`, `habit-tracker-ai-mcp`, `hash-utils-ai-mcp`, `health-check-ai-mcp`, `healthcare-ai-governance-mcp`, `healthcare-fhir-mcp`, `hipaa-compliance-mcp`, `html-parser-ai-mcp`, `hydration-reminder-ai-mcp`, `icon-generator-ai-mcp`, `image-metadata-ai-mcp`**
  `pyproject.toml`: `"mcp>=1.0.0"` -> `"mcp>=2.0.0"` on a real dependency line (none invented) +
  `only-include` list gained `"mcp2026_shim.py"` so the shim ships in the wheel;
  `server.py`: `from mcp.server.fastmcp import FastMCP` -> `from mcp.server.mcpserver import MCPServer as FastMCP`
  (forced companion rename - `mcp.server.fastmcp` raises `ModuleNotFoundError` by design in mcp 2.x)
  + migration-note block; `mcp-wrapper.py`: `transport="streamable-http"` ingress rewired to
  `ShimASGI(mcp_server.streamable_http_app(json_response=True))` with served cards
  2025-11-25 -> 2026-07-28; `mcp2026_shim.py` vendored; `MIGRATION_NOTE.md`. **5 files each.**
* **py-stdio (1 repo): `gods-eye-geospatial-mcp`**
  same pin + rename + include-list edit, no wrapper exists, so `server.py` got the note block plus
  the `http_app()` enable path (`ShimASGI(mcp.streamable_http_app(json_response=True))`) and the
  note states `headers N/A at runtime`. **4 files.**
* **TS (2 repos): `gaming-ai`, `healthcare-ai`**
  `package.json` pins `@modelcontextprotocol/sdk` - **left untouched**: no release of that SDK
  speaks 2026-07-28 and inventing a JS pin is forbidden (wave-1 rule). `mcp2026_shim.py` vendored as
  the reference middleware + `//` migration-note block above `async function main()` in `src/index.ts`
  (stdio `StdioServerTransport`, headers N/A at runtime, JS-pin gap stated in code) + `MIGRATION_NOTE.md`.
  **3 files each.**
* **package.json-only stubs (5 repos): `git-operations`, `github-api`, `gitlab-api`, `google-drive`, `incident-response`**
  the tree is 5 blobs (package.json, README, LICENSE, .gitignore, .github/FUNDING.yml) - there is
  **no server entry point at all** (the declared `dist/index.js` is not in the repository). No pin
  exists to move (JS or Python), so this branch delivers exactly what the hard rule allows:
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
| before | 18 | `2026-07 / header-add` - the `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (registry token, known false-positive class; all 18 carry `mcp-name-header`), **not** wire code |
| before | 7 | `unknown / header-add` (2 TS + 5 stubs) - the census's honest pre-state |
| **after (this branch)** | **20** | **`2026-07 / handshake-removal`** (18 Python + 2 TypeScript - note-text driven) |
| after (this branch) | 5 | `unknown / header-add` unchanged - package.json-only repos: no scanned surface changed (shim self-excluded, `.md` not scanned, `package.json` deliberately untouched) |
| control (note text removed) | 18 | `2026-07 / header-add` |
| control (note text removed) | 7 | `unknown / header-add` - control == before on all 25, which is the provenance proof |

Read the `after` rows honestly: the audit tool excludes its own shim (`SELF_FILES`) and does not
scan `.md`, so the new `protocol-2026-07-28` / `mcp-method-header` / `mcp-name-header` /
`server-discover` signals are read from the migration-note text (Python comment block / TS comment
block), and `session-id` is prose about the shim *stripping* that header. Runtime evidence for the
wire is the `mcp>=2.0.0` pin (2.3.0 speaks 2026-07-28) plus the shim at the ingress;
`mcp>=2.0.0` alone is not a wire signal for this scanner. **After-rows are note-text-driven until
post-merge re-audit.** The 5 stub rows do not move at all - that is the honest reading, not a pass.

* **CI sampled on 4 PRs (no failures):** `fitness-ai-mcp` `test (3.11)` pass + CodeQL pass +
  `Analyze (python)` pass; `flight-logger-mcp` `test (3.10)` / `test (3.11)` / `test (3.12)` pass;
  `hipaa-compliance-mcp` `test (3.10)` / `test (3.11)` / `test (3.12)` pass; `gaming-ai` (TS)
  Cursor checks neutral/success/in-progress, none failing - the pin and the `FastMCP -> MCPServer`
  rename import and run under mcp 2.x.
* **PR read-back after creation (all 25):** `state: open`, `base: main`, head
  `mcp-2026-wire-header-add`, `changed_files` 5 (17 py-http) / 4 (`gods-eye-geospatial-mcp`) /
  3 (2 TS) / 5 (2-file stubs: `git-operations`, `github-api`, `gitlab-api`, `google-drive`,
  `incident-response`).
* **Independent second read-back (sampled 5, one per class):** every body field verified present -
  class, deadline, plan link, verify command, before/after/control rows, census row, honesty line,
  title prefix `MCP 2026-07-28 wire: header-add`.
* **Default branches untouched (sampled 4):** `GET contents/MIGRATION_NOTE.md?ref=main` -> 404 on
  `gaming-ai`, `git-operations`, `fitness-ai-mcp` (plus a batch-1 repo as control). No push, no
  force, no merge was made by this lane; every write went through `POST git/refs` / `PUT contents` /
  `POST pulls` on the `mcp-2026-wire-header-add` branch only.
* **422 rule:** implemented pre-emptively - every repo was checked for an open PR with head
  `mcp-2026-wire-header-add` **before any write**, and branch content was verified byte-identical
  (git blob SHA1 of local files vs branch tree) before any body re-PATCH. No pre-existing PR and no
  foreign branch content was found in this slice: **0 re-PATCHes, 0 content-conflict skips.**

## 5. API budget and rate discipline

* **~425 `gh api` calls against the 600 hard cap:** 50 discovery (25 repo meta + 25 recursive
  trees), 125 in the first push pass (see the false-skip gap below), 231 in the successful pass
  (25 PR pre-checks + branch/tree verification + PUTs + PRs + read-backs), 19 verification reads
  (5 body read-backs, 4 default-branch 404 checks, 4 mis-routed probe calls, 6 CI reads).
  `gh api rate_limit` probes (no core-quota cost) read 5000/5000 at start and after completion.
* 0.30 s pacing between calls, 30 s exponential backoff armed for secondary limits: **0
  secondary-limit hits**. Deterministic HTTP 4xx are not retried.
* **Wall time: ~26 minutes** (02:55 UTC selection -> 03:21 UTC report), well inside the 90-minute
  budget.

## 6. Known gaps carried forward

* **False-skip first pass (this lane's bug, fully recovered):** the first push pass treated the
  pending recipe diff on a freshly created branch (branch == default branch) as "foreign material
  changes" and skipped all 25 repos. No PR was opened and no file content was written in that pass;
  the 25 skip records were cleared, the condition was corrected (skip only when a non-recipe file
  changed, or an intended file was written by someone else with different bytes), and the re-run
  opened all 25 PRs cleanly. Cost: 125 API calls, ~2 minutes. Recorded here rather than silently
  dropped.
* The `after` audit rows for the 20 note-bearing repos are note-text-driven: re-audit after merge
  and after a live probe (plan section 6.5) before anyone quotes `migration: none`. The 5 stub
  rows stay `unknown / header-add` until those repositories get a real entry point.
* `gaming-ai` / `healthcare-ai`: the TS servers themselves still do not implement the four runbook
  duties - the branch delivers the comment record + reference shim only, because no
  `@modelcontextprotocol/sdk` release speaks 2026-07-28 (follow-up stated in both `MIGRATION_NOTE.md`
  files).
* `flight-logger-mcp` `package.json` declares an npm dependency `"mcp": "^1.0.0"` - **left
  unpinned**: the npm package `mcp` is not the MCP SDK and no JS pin was invented (stated in its
  `MIGRATION_NOTE.md`).
* The before-era `2026-07` on the 18 Python repos is the `.well-known/agent-card.json` `"mcp_name"`
  token, a scanner false-positive: those repos are **not** evidence of 2026-07-28 wire support
  before this branch. The census row (`unknown / header-add`) is the honest pre-state.
* Static declaration surfaces (`.well-known/*.json`, `server.json`, `manifest.json`, `README.md`)
  still declare older wires - listed as follow-ups in each `MIGRATION_NOTE.md`, not silent-edited
  (Art. 21: a declaration change gets its own commit).
* No git commit in `~/clawd` from this lane - the parent lane commits this report.

## 7. Artifacts

* `MCP_HEADER_ADD_WAVE2_BATCH7_2026-10-08.md` - this report.
* Per repo, on `mcp-2026-wire-header-add`: `mcp2026_shim.py`, `MIGRATION_NOTE.md`, pinned
  `pyproject.toml`, edited `server.py` (+ `mcp-wrapper.py` on the 17 HTTP repos;
  + `src/index.ts` on the 2 TS repos).
* Scratch (pruned after 24 h): `~/.hermes/cache/scratch/m7_{discover,refetch,before,patch,audit,note,push}.py`,
  `m7_{discovery,before,patch,audits,push}.json`, `m7_table.md`, `m7_rows.json`, `m7_push.log`,
  `m7_push2.log`. Reconstructed trees under `/tmp/mig7b/` removed on lane exit.
