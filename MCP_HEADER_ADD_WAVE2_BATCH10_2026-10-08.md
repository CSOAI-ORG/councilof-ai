# MCP header-add migration wave 2, batch 10 (25 PRs)

**Date:** 2026-10-08 - **Lane:** M4 MCP-migration (wave 2, batch 10 of the auto-rolling sequence, attempt 3) - **Status:** complete, 25/25 PRs open
**Runbook:** `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md` section 3 (header-add) + section 4 (the shim as bridge)
**Pattern proven by:** `MCP_HEADER_ADD_WAVE1_2026-10-07.md` (10/10), `MCP_HEADER_ADD_WAVE2_BATCH1_2026-10-08.md` (25/25), `MCP_HEADER_ADD_WAVE2_BATCH7_2026-10-08.md` (25/25) - same branch name, same steps, same verify.
**Method:** the batch-7 script set was **copied and parameterised** (slice path -> `mig-batch10-slice.json`, tmp dir -> `/tmp/mig10b`, outputs -> `m10_*`, batch label -> 10). The abandoned `m10b_*.py` scripts from attempts 1-2 were **not opened, not imported, not reused**; they are dead scratch.
**Scope:** CSOAI-ORG repos only, branch `mcp-2026-wire-header-add`, base = each repo's default branch, no default-branch pushes, no force, no clones (reads via `gh api` + `raw.githubusercontent.com` through `curl`; system Python has no CA certs, so the batch-7 `urllib` fetcher was swapped for `curl` - see 6).
**Deprecation deadline carried in every PR:** the legacy wire dies **2027-07-28**.

## 1. Selection

From `~/.hermes/cache/scratch/mig-batch10-slice.json` - a LIVE-deduped slice of exactly **25 repos**, taken as-is, never substituted. Every one exists (HTTP 200 on `repos/CSOAI-ORG/<repo>`), none archived, none a fork -> **0 skips**.
All 25 census rows (`MCP_WIRE_CENSUS_GITHUB_2026-10-07.jsonl`) are `era: unknown / class: header-add`.

**422 pre-check before any write:** all 25 repos were probed for an open PR with head `CSOAI-ORG:mcp-2026-wire-header-add` and for the existence of that branch *before* this lane touched anything, to catch partial writes left by attempts 1-2. Result: **0 pre-existing PRs, 0 pre-existing branches** - attempts 1-2 died in scratch, before any GitHub write. So there was nothing to byte-verify, nothing to re-PATCH, and no repo could receive a second PR.

## 2. Results

| # | repo | PR | census era/class | before (local audit) | after (verify) | control | files changed | notes |
|--:|---|---|---|---|---|---|---|---|
| 1 | `pdf-document-mcp` | https://github.com/CSOAI-ORG/pdf-document-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"` (real dep line; FastMCP -> MCPServer rename); HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards -> 2026-07-28 |
| 2 | `pdf-merge-ai-mcp` | https://github.com/CSOAI-ORG/pdf-merge-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"` (real dep line; FastMCP -> MCPServer rename); HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards -> 2026-07-28 |
| 3 | `pdf-tools-ai-mcp` | https://github.com/CSOAI-ORG/pdf-tools-ai-mcp/pull/14 (PR #14) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"` (real dep line; FastMCP -> MCPServer rename); HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards -> 2026-07-28 |
| 4 | `performance-ai-mcp` | https://github.com/CSOAI-ORG/performance-ai-mcp/pull/14 (PR #14) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"` (real dep line; FastMCP -> MCPServer rename); HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards -> 2026-07-28 |
| 5 | `personal-finance-ai-mcp` | https://github.com/CSOAI-ORG/personal-finance-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"` (real dep line; FastMCP -> MCPServer rename); HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards -> 2026-07-28 |
| 6 | `pet-care-ai-mcp` | https://github.com/CSOAI-ORG/pet-care-ai-mcp/pull/18 (PR #18) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"` (real dep line; FastMCP -> MCPServer rename); HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards -> 2026-07-28 |
| 7 | `photography-ai-mcp` | https://github.com/CSOAI-ORG/photography-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"` (real dep line; FastMCP -> MCPServer rename); HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards -> 2026-07-28 |
| 8 | `plagiarism-checker-ai-mcp` | https://github.com/CSOAI-ORG/plagiarism-checker-ai-mcp/pull/18 (PR #18) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"` (real dep line; FastMCP -> MCPServer rename); HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards -> 2026-07-28 |
| 9 | `planthire-ai-mcp` | https://github.com/CSOAI-ORG/planthire-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.28.0"` -> `"mcp>=2.0.0"` (real dep line; FastMCP -> MCPServer rename); HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards -> 2026-07-28; pin was `>=1.28.0` |
| 10 | `playwright-browser` | https://github.com/CSOAI-ORG/playwright-browser/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2: `mcp2026_shim.py`, `MIGRATION_NOTE.md` | package.json-only (no server entry point): shim + MIGRATION_NOTE.md only, no pin invented; after == before by construction |
| 11 | `pmcp-gateway` | https://github.com/CSOAI-ORG/pmcp-gateway/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2: `mcp2026_shim.py`, `MIGRATION_NOTE.md` | package.json-only (no server entry point): shim + MIGRATION_NOTE.md only, no pin invented; after == before by construction |
| 12 | `policy-engine` | https://github.com/CSOAI-ORG/policy-engine/pull/3 (PR #3) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2: `mcp2026_shim.py`, `MIGRATION_NOTE.md` | package.json-only (no server entry point): shim + MIGRATION_NOTE.md only, no pin invented; after == before by construction |
| 13 | `pomodoro-ai-mcp` | https://github.com/CSOAI-ORG/pomodoro-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"` (real dep line; FastMCP -> MCPServer rename); HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards -> 2026-07-28 |
| 14 | `postgres-db` | https://github.com/CSOAI-ORG/postgres-db/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2: `mcp2026_shim.py`, `MIGRATION_NOTE.md` | package.json-only (no server entry point): shim + MIGRATION_NOTE.md only, no pin invented; after == before by construction |
| 15 | `price-tracker-ai-mcp` | https://github.com/CSOAI-ORG/price-tracker-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"` (real dep line; FastMCP -> MCPServer rename); HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards -> 2026-07-28 |
| 16 | `project-management-ai-mcp` | https://github.com/CSOAI-ORG/project-management-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"` (real dep line; FastMCP -> MCPServer rename); HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards -> 2026-07-28 |
| 17 | `proofof-ai` | https://github.com/CSOAI-ORG/proofof-ai/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 3: `mcp2026_shim.py`, `src/index.ts`, `MIGRATION_NOTE.md` | no JS pin invented (no `@modelcontextprotocol/sdk` release speaks 2026-07-28); shim + `//` note block in `src/index.ts` |
| 18 | `puppeteer-headless` | https://github.com/CSOAI-ORG/puppeteer-headless/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2: `mcp2026_shim.py`, `MIGRATION_NOTE.md` | package.json-only (no server entry point): shim + MIGRATION_NOTE.md only, no pin invented; after == before by construction |
| 19 | `qidi-printer-mcp` | https://github.com/CSOAI-ORG/qidi-printer-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"` (real dep line; FastMCP -> MCPServer rename); py-stdio: note block + `http_app()` enable path, no wrapper in tree |
| 20 | `qr-code-ai-mcp` | https://github.com/CSOAI-ORG/qr-code-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"` (real dep line; FastMCP -> MCPServer rename); HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards -> 2026-07-28 |
| 21 | `quantranet-pqc` | https://github.com/CSOAI-ORG/quantranet-pqc/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 3: `mcp2026_shim.py`, `src/index.ts`, `MIGRATION_NOTE.md` | no JS pin invented (no `@modelcontextprotocol/sdk` release speaks 2026-07-28); shim + `//` note block in `src/index.ts` |
| 22 | `quiz-generator-ai-mcp` | https://github.com/CSOAI-ORG/quiz-generator-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"` (real dep line; FastMCP -> MCPServer rename); HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards -> 2026-07-28 |
| 23 | `rag-knowledge-mcp` | https://github.com/CSOAI-ORG/rag-knowledge-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"` (real dep line; FastMCP -> MCPServer rename); HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards -> 2026-07-28 |
| 24 | `readme-generator-ai-mcp` | https://github.com/CSOAI-ORG/readme-generator-ai-mcp/pull/18 (PR #18) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `mcp-wrapper.py`, `mcp2026_shim.py`, `pyproject.toml`, `server.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"` (real dep line; FastMCP -> MCPServer rename); HTTP entry: `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards -> 2026-07-28 |
| 25 | `real-estate-ai` | https://github.com/CSOAI-ORG/real-estate-ai/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 3: `mcp2026_shim.py`, `src/index.ts`, `MIGRATION_NOTE.md` | no JS pin invented (no `@modelcontextprotocol/sdk` release speaks 2026-07-28); shim + `//` note block in `src/index.ts` |

Every PR body carries: class `header-add`, the runbook steps applied, the verify command
`PYTHONPATH= /opt/homebrew/bin/python3.11 ~/clawd/mcp_wire_audit.py audit --local <repo>`, the
before/after/control table, the line **"After-rows are note-text-driven until post-merge re-audit"**,
a link to `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md`, the census row, and the 2027-07-28
deprecation deadline.

## 3. What the runbook produced per repo (4 groups)

This slice is a mixed family - 17 Python servers, 3 TypeScript servers, 5 package.json-only
stubs - so the batch splits into four diffs:

* **py-http (16 repos): `pdf-document-mcp`, `pdf-merge-ai-mcp`, `pdf-tools-ai-mcp`, `performance-ai-mcp`, `personal-finance-ai-mcp`, `pet-care-ai-mcp`, `photography-ai-mcp`, `plagiarism-checker-ai-mcp`, `planthire-ai-mcp`, `pomodoro-ai-mcp`, `price-tracker-ai-mcp`, `project-management-ai-mcp`, `qr-code-ai-mcp`, `quiz-generator-ai-mcp`, `rag-knowledge-mcp`, `readme-generator-ai-mcp`**
  `pyproject.toml`: `"mcp>=1.0.0"` -> `"mcp>=2.0.0"` on a real dependency line (none invented; `planthire-ai-mcp` was `"mcp>=1.28.0"`) + `only-include` list gained `"mcp2026_shim.py"` so the shim ships in the wheel;
  `server.py`: `from mcp.server.fastmcp import FastMCP` -> `from mcp.server.mcpserver import MCPServer as FastMCP`
  (forced companion rename - `mcp.server.fastmcp` raises `ModuleNotFoundError` by design in mcp 2.x)
  + migration-note block above `def main():`; `mcp-wrapper.py`: `transport="streamable-http"` ingress rewired to
  `ShimASGI(mcp_server.streamable_http_app(json_response=True))` with served cards
  2025-11-25 -> 2026-07-28; `mcp2026_shim.py` vendored; `MIGRATION_NOTE.md`. **5 files each.**
* **py-stdio (1 repo): `qidi-printer-mcp`**
  same pin + rename + include-list edit, no `mcp-wrapper.py` exists in the tree, so `server.py` got the
  note block plus the `http_app()` enable path
  (`ShimASGI(mcp.streamable_http_app(json_response=True))`) and the note states `headers N/A at runtime`.
  **4 files.** It also has no `package.json` - the only repo in the slice without one.
* **TS (3 repos): `proofof-ai`, `quantranet-pqc`, `real-estate-ai`**
  `package.json` pins `@modelcontextprotocol/sdk` - **left untouched**: no release of that SDK
  speaks 2026-07-28 and inventing a JS pin is forbidden (wave-1 rule). `mcp2026_shim.py` vendored as
  the reference middleware + `//` migration-note block above `async function main()` in `src/index.ts`
  (stdio `StdioServerTransport`, headers N/A at runtime, JS-pin gap stated in code) + `MIGRATION_NOTE.md`.
  **3 files each.** `proofof-ai` declares `async function main(): Promise<void>` (the other two `async function main()`), so the insert anchor had to accept a return type - see 6.
* **package.json-only stubs (5 repos): `playwright-browser`, `pmcp-gateway`, `policy-engine`, `postgres-db`, `puppeteer-headless`**
  the tree is exactly 5 blobs (`package.json`, `README.md`, `LICENSE`, `.gitignore`, `.github/FUNDING.yml`)
  in all five - there is **no server entry point at all**. No pin exists to move (JS or Python), so this
  branch delivers exactly what the hard rule allows: vendored `mcp2026_shim.py` + an honest
  `MIGRATION_NOTE.md`. Nothing executable changed. **2 files each.**
* **JS:** no `@modelcontextprotocol/sdk` pin was changed anywhere in this batch - wave-1 rule: no
  JS SDK release speaks 2026-07-28, so any JS pin would be invented.

## 4. Verification receipts

Local audits ran against fully reconstructed trees (every scannable file of the default branch's
`git/trees` listing, fetched via raw.githubusercontent, 404 files total, 0 fetch failures), before
patching, after patching, and with the migration-note text deleted (control):

| state | repos | reading |
|---|---|---|
| before | 17 | `2026-07 / header-add` - the `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (registry token, known false-positive class; all 17 carry `mcp-name-header`), **not** wire code |
| before | 8 | `unknown / header-add` (3 TS + 5 stubs) - the census's honest pre-state |
| **after (this branch)** | **20** | **`2026-07 / handshake-removal`** (17 Python + 3 TypeScript - note-text driven) |
| after (this branch) | 5 | `unknown / header-add` unchanged - package.json-only repos: no scanned surface changed (shim self-excluded, `.md` not scanned, `package.json` deliberately untouched) |
| control (note text removed) | 17 | `2026-07 / header-add` |
| control (note text removed) | 8 | `unknown / header-add` - **control == before on all 25**, which is the provenance proof |

Read the `after` rows honestly: the audit tool excludes its own shim (`SELF_FILES`) and does not
scan `.md`, so the new `protocol-2026-07-28` / `mcp-method-header` / `mcp-name-header` /
`server-discover` signals are read from the migration-note text (Python comment block / TS comment
block), and `session-id` is prose about the shim *stripping* that header. Runtime evidence for the
wire is the `mcp>=2.0.0` pin (2.3.0 speaks 2026-07-28) plus the shim at the ingress;
`mcp>=2.0.0` alone is not a wire signal for this scanner. **After-rows are note-text-driven until
post-merge re-audit.** The 5 stub rows do not move at all - that is the honest reading, not a pass.

* **PR read-back after creation (all 25):** `state: open`, `base: main`, head
  `mcp-2026-wire-header-add`, exactly one open PR per repo (no duplicates anywhere),
  `changed_files` 5 (16 py-http) / 4 (`qidi-printer-mcp`) / 3 (3 TS) / 2 (5 stubs).
  The locally computed file list matches the PR `changed_files` on **25/25** with zero mismatch.
* **Body field check (all 25, programmatic):** every body contains class `header-add`, the
  2027-07-28 deadline, the plan link, the verify command, the three `before (default branch)` /
  `**after (this branch)**` / `control (migration-note block removed)` rows, and the exact line
  `After-rows are note-text-driven until post-merge re-audit`. **0 missing fields.**
* **Branch bytes == local (sampled 8, one raw fetch each, no API cost):** sha256 match on
  `pdf-document-mcp/server.py`, `pdf-document-mcp/pyproject.toml`, `planthire-ai-mcp/pyproject.toml`,
  `quantranet-pqc/src/index.ts`, `proofof-ai/src/index.ts`, `real-estate-ai/src/index.ts`,
  `qidi-printer-mcp/MIGRATION_NOTE.md`, `postgres-db/MIGRATION_NOTE.md`.
* **Default branches untouched (sampled 5, raw fetch, no API cost):** `main/MIGRATION_NOTE.md`
  and `main/mcp2026_shim.py` both **404** on `pdf-document-mcp`, `qidi-printer-mcp`, `proofof-ai`,
  `postgres-db`, `real-estate-ai`. Branch list of `proofof-ai` = exactly `main` +
  `mcp-2026-wire-header-add`. No push, no force, no merge was made by this lane; every write went
  through `POST git/refs` / `PUT contents` / `POST pulls` on the `mcp-2026-wire-header-add` branch only.
* **Syntax sanity before upload:** all 25 patched `server.py` + `mcp-wrapper.py` files
  `py_compile` clean; the 3 `src/index.ts` files each contain exactly one `async function main(`
  declaration with a well-formed signature; a tree-wide grep for `main())` returns nothing.
* **CI sampled on 4 PRs (one per class, no failures):** `pdf-document-mcp` `test (3.10)` /
  `test (3.11)` / `test (3.12)` all `completed/success`, Cursor Approval Agent `success`, Bugbot
  `neutral`; `qidi-printer-mcp` `test (3.11)` / `test (3.12)` `success` (Security Reviewer still
  `in_progress`); `proofof-ai` (TS) Cursor Approval `success` + Security Agent `success`; `postgres-db`
  (stub) Cursor Approval `success`, Security `neutral`. No red check on any sampled PR.
* **422 rule:** implemented pre-emptively - the PR-list pre-check ran before any write on all 25,
  and branch content was verified byte-identical (git blob SHA1 of local files vs branch tree)
  before any body re-PATCH. **0 pre-existing PRs, 0 content-conflict skips, 0 re-PATCHes, 0 second PRs.**

## 5. API budget and rate discipline

* **~451 `gh api` calls against the 600 hard cap:** 50 attempt-2 residue pre-check (25 PR-list +
  25 branch-get), 50 discovery (25 repo meta + 25 recursive trees), 180 in push pass 1, 105 in push
  pass 2, 8 in push pass 3, 50 PR read-back (25 list + 25 detail), 8 CI sample reads. `gh api
  rate_limit` probes (no core-quota cost) read 5000/5000 at start and at completion.
* 0.30 s pacing between calls, 30 s exponential backoff armed for secondary limits: **0
  secondary-limit hits, 0 rate-limit sleeps.** Deterministic HTTP 4xx are not retried.
* **Wall time: ~25 minutes** (03:48 UTC selection -> 04:13 UTC report), well inside the 90-minute budget.

## 6. Known gaps carried forward

* **Provenance of the script set (this lane's one real fix, fully recovered):** `m7_patch.py` on disk
  had drifted from the version that actually shipped batch 7 - it re-appends the closing paren of
  `async function main(`, so the TS insert emitted `async function main()) {` and failed outright on
  `proofof-ai` (whose signature carries `: Promise<void>`). Caught before upload by grepping the
  patched trees. **Fix (1 script, 2 lines, attempt 1):** drop the stray `+ ''')'''` so the block ends
  at `main(`, and loosen the anchor from `^async function main\(\) \{` to `^async function main\(`.
  The reconstructed trees were then wiped and re-fetched pristine from the default branch (404 files,
  0 failures), and `before` -> `patch` -> `after/control` -> `MIGRATION_NOTE` were re-run from scratch
  so no stale action text leaked into any PR body. **Cross-lane note:** the drifted `m7_patch.py` is a
  live hazard for any lane that copies it without re-checking the TS insert - batch 9 shipped from it
  and banked its own repair, and batch 8's 4 TS PRs were flagged defective by that lane's own report
  (clawd commit `13e9f00a5` / `db6698108`). **Re-verified from this lane at 04:15 UTC: all five
  previously-flagged TS repos - `media-advertising-ai`, `mining-ai`, `oneos-education` (batch 9) and
  `gaming-ai`, `healthcare-ai` (batch 7) - now read `async function main() {`, i.e. clean; nothing
  outstanding for this lane to carry, recorded only so the drift is not re-introduced by a future
  copy of `m7_patch.py`.
* **Transient network failure (recovered, no data lost):** on push pass 1 the connection to
  `api.github.com` dropped after repo 15 and the script recorded `error / head-ref / pr-check` on the
  remaining 10 (the error text `error connecting to api.github.com` does not match the script's
  502/503/504 backoff patterns, so it surfaced immediately rather than hanging). The script keeps
  `pr-open` records and re-queues everything else, so a plain re-run after connectivity returned
  opened the missing PRs; pass 2 hit a second blip on `quantranet-pqc` (`git/trees/main` EOF) after
  its branch had already been created - pass 3 recovered it through the byte-identity check and opened
  its PR. **No duplicate PR, no partial branch content, no clobber:** 3 passes, 25 unique PRs.
* The `after` audit rows for the 20 note-bearing repos are note-text-driven: re-audit after merge
  and after a live probe (plan section 6.5) before anyone quotes `migration: none`. The 5 stub
  rows stay `unknown / header-add` until those repositories get a real entry point.
* `proofof-ai` / `quantranet-pqc` / `real-estate-ai`: the TS servers themselves still do not implement
  the four runbook duties - the branch delivers the comment record + reference shim only, because no
  `@modelcontextprotocol/sdk` release speaks 2026-07-28 (follow-up stated in all three
  `MIGRATION_NOTE.md` files).
* The before-era `2026-07` on the 17 Python repos is the `.well-known/agent-card.json` `"mcp_name"`
  token, a scanner false-positive: those repos are **not** evidence of 2026-07-28 wire support
  before this branch. The census row (`unknown / header-add`) is the honest pre-state.
* Static declaration surfaces (`.well-known/*.json`, `server.json`, `manifest.json`, `README.md`)
  still declare older wires - listed as follow-ups in each `MIGRATION_NOTE.md`, not silent-edited
  (Art. 21: a declaration change gets its own commit).
* No git commit in `~/clawd` from this lane - the parent lane commits this report.

## 7. Artifacts

* `MCP_HEADER_ADD_WAVE2_BATCH10_2026-10-08.md` - this report.
* Per repo, on `mcp-2026-wire-header-add`: `mcp2026_shim.py`, `MIGRATION_NOTE.md`, pinned
  `pyproject.toml`, edited `server.py` (+ `mcp-wrapper.py` on the 16 HTTP repos;
  + `src/index.ts` on the 3 TS repos).
* Scratch (pruned after 24 h): `~/.hermes/cache/scratch/m10_{discover,before,patch,audit,note,push}.py`,
  `m10_{discovery,before,patch,audits,push,readback}.json`, `m10_table.md`,
  `m10_push.log`, `m10_push2.log`, `m10_push3.log`.
* Reconstructed trees under `/tmp/mig10b/` removed on lane exit.
