# MCP header-add migration wave 2, batch 11 (25 PRs)

**Date:** 2026-10-08 - **Lane:** M4 MCP-migration (wave 2, batch 11) - **Status:** complete, 25/25 PRs open
**Runbook:** `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md` section 3 (header-add) + section 4 (the shim as bridge)
**Pattern proven by:** `MCP_HEADER_ADD_WAVE1_2026-10-07.md` (10/10), `MCP_HEADER_ADD_WAVE2_BATCH1_2026-10-08.md` (25/25), `MCP_HEADER_ADD_WAVE2_BATCH9_2026-10-08.md` (25/25) - same branch name, same steps, same verify, same four honest groups.
**Scope:** CSOAI-ORG repos only, branch `mcp-2026-wire-header-add`, base = each repo's default branch, no default-branch pushes, no force, no clones (reads via `gh api` + `raw.githubusercontent.com` through `curl`).
**Deprecation deadline carried in every PR:** the legacy wire dies **2027-07-28**.
**Execution note:** this was attempt 2 of the batch - attempt 1 lost its session turn lease while holding a ~330 s discover run inside one foreground terminal call. Every stage that can exceed 120 s (discover, push, verify) was run as a background process with log polling in attempt 2; no foreground call exceeded 4 minutes.

## 1. Selection

From `~/.hermes/cache/scratch/mig-batch11-slice.json` - exactly **25 repos**, taken as-is, never substituted. All 25 discovered `ready`: none missing, none archived, none a fork, **0 fetch failures**, **0 skips**.
All 25 census rows (`MCP_WIRE_CENSUS_GITHUB_2026-10-07.jsonl`) are `era: unknown / class: header-add`. The slice was cut by the coordinator; this lane does not re-derive the remaining pool.

## 2. Results

| # | repo | PR | census era/class | before (local audit) | after (verify) | control | files | notes |
|--:|---|---|---|---|---|---|---|---|
| 1 | `real-estate-listing-mcp` | https://github.com/CSOAI-ORG/real-estate-listing-mcp/pull/18 (PR #18) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class); 5 files |
| 2 | `recipe-finder-ai-mcp` | https://github.com/CSOAI-ORG/recipe-finder-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class); 5 files |
| 3 | `recruitment-ai-mcp` | https://github.com/CSOAI-ORG/recruitment-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class); 5 files |
| 4 | `red-team-ops` | https://github.com/CSOAI-ORG/red-team-ops/pull/3 (PR #3) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2 | package.json-only (no server entry point): shim + honest note only; after == before by construction; 2 files |
| 5 | `regex-ai-mcp` | https://github.com/CSOAI-ORG/regex-ai-mcp/pull/18 (PR #18) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class); 5 files |
| 6 | `restaurant-ai-mcp` | https://github.com/CSOAI-ORG/restaurant-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class); 5 files |
| 7 | `resume-parser-ai-mcp` | https://github.com/CSOAI-ORG/resume-parser-ai-mcp/pull/18 (PR #18) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class); 5 files |
| 8 | `retail-ai` | https://github.com/CSOAI-ORG/retail-ai/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 3 | no JS pin invented (`@modelcontextprotocol/sdk` has no 2026-07-28 release); shim vendored + `//` note block in `src/index.ts`; 3 files |
| 9 | `robotics-control-mcp` | https://github.com/CSOAI-ORG/robotics-control-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class); 5 files |
| 10 | `scam-detector-mcp` | https://github.com/CSOAI-ORG/scam-detector-mcp/pull/7 (PR #7) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; stdio-only: headers N/A at runtime; `http_app()` enable path + note; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class); 4 files |
| 11 | `schema-validator-ai-mcp` | https://github.com/CSOAI-ORG/schema-validator-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class); 5 files |
| 12 | `secure-comms` | https://github.com/CSOAI-ORG/secure-comms/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2 | package.json-only (no server entry point): shim + honest note only; after == before by construction; 2 files |
| 13 | `security-scanner-ai-mcp` | https://github.com/CSOAI-ORG/security-scanner-ai-mcp/pull/18 (PR #18) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class); 5 files |
| 14 | `sentiment-analysis-ai-mcp` | https://github.com/CSOAI-ORG/sentiment-analysis-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class); 5 files |
| 15 | `sentry-monitoring` | https://github.com/CSOAI-ORG/sentry-monitoring/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2 | package.json-only (no server entry point): shim + honest note only; after == before by construction; 2 files |
| 16 | `sequential-thinking` | https://github.com/CSOAI-ORG/sequential-thinking/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2 | package.json-only (no server entry point): shim + honest note only; after == before by construction; 2 files |
| 17 | `slack-enterprise-mcp` | https://github.com/CSOAI-ORG/slack-enterprise-mcp/pull/14 (PR #14) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class); 5 files |
| 18 | `slack-messaging` | https://github.com/CSOAI-ORG/slack-messaging/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **unknown / header-add** | unknown / header-add | 2 | package.json-only (no server entry point): shim + honest note only; after == before by construction; 2 files |
| 19 | `sleep-tracker-ai-mcp` | https://github.com/CSOAI-ORG/sleep-tracker-ai-mcp/pull/14 (PR #14) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class); 5 files |
| 20 | `slugify-ai-mcp` | https://github.com/CSOAI-ORG/slugify-ai-mcp/pull/1 (PR #1) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class); 5 files |
| 21 | `smart-cities-ai` | https://github.com/CSOAI-ORG/smart-cities-ai/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 3 | no JS pin invented (`@modelcontextprotocol/sdk` has no 2026-07-28 release); shim vendored + `//` note block in `src/index.ts`; 3 files |
| 22 | `soc2-compliance-ai-mcp` | https://github.com/CSOAI-ORG/soc2-compliance-ai-mcp/pull/11 (PR #11) | unknown / header-add | 2025-11 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before era `2025-11`; control is `2026-07` because the recipe moved the wrapper's executable served cards (not note text) - the only control != before row; 5 files |
| 23 | `social-media-ai-mcp` | https://github.com/CSOAI-ORG/social-media-ai-mcp/pull/2 (PR #2) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class); 5 files |
| 24 | `sovereign-self-healing-mcp` | https://github.com/CSOAI-ORG/sovereign-self-healing-mcp/pull/18 (PR #18) | unknown / header-add | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5 | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; HTTP entry `mcp-wrapper.py` -> `ShimASGI(...)` wired, served cards 2025-11-25 -> 2026-07-28; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class); 5 files |
| 25 | `space-ai` | https://github.com/CSOAI-ORG/space-ai/pull/1 (PR #1) | unknown / header-add | unknown / header-add | **2026-07 / handshake-removal** | unknown / header-add | 3 | no JS pin invented (`@modelcontextprotocol/sdk` has no 2026-07-28 release); shim vendored + `//` note block in `src/index.ts`; 3 files |

Every PR body carries, verified by read-back on all 25: class `header-add` heading, the runbook steps applied, the verify command
`PYTHONPATH= /opt/homebrew/bin/python3.11 ~/clawd/mcp_wire_audit.py audit --local <repo>`, the
before/after/control table, the line **"After-rows are note-text-driven until post-merge re-audit"**,
a link to `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md`, the census row (`**Census row:** era ...`),
and the 2027-07-28 deprecation deadline.

## 3. What the runbook produced per repo (4 groups)

This slice is a mixed family - 17 Python servers, 3 TypeScript servers, 5 package.json-only stubs -
so the batch splits into four diffs (**103 files changed in total**):

* **py-http (16 repos):** `real-estate-listing-mcp`, `recipe-finder-ai-mcp`, `recruitment-ai-mcp`, `regex-ai-mcp`, `restaurant-ai-mcp`, `resume-parser-ai-mcp`, `robotics-control-mcp`, `schema-validator-ai-mcp`, `security-scanner-ai-mcp`, `sentiment-analysis-ai-mcp`, `slack-enterprise-mcp`, `sleep-tracker-ai-mcp`, `slugify-ai-mcp`, `soc2-compliance-ai-mcp`, `social-media-ai-mcp`, `sovereign-self-healing-mcp`
  `pyproject.toml`: `"mcp>=1.0.0"` -> `"mcp>=2.0.0"` on a real dependency line (none invented; all 17
  Python repos in this slice carried the same real `mcp>=1.0.0` line) + `only-include` list gained
  `"mcp2026_shim.py"` so the shim ships in the wheel; `server.py`:
  `from mcp.server.fastmcp import FastMCP` -> `from mcp.server.mcpserver import MCPServer as FastMCP`
  (forced companion rename - `mcp.server.fastmcp` raises `ModuleNotFoundError` by design in mcp 2.x)
  + migration-note block above `def main():`; `mcp-wrapper.py`: streamable-HTTP ingress rewired to
  `ShimASGI(mcp_server.streamable_http_app(json_response=True))` with served cards
  2025-11-25 -> 2026-07-28; `mcp2026_shim.py` vendored; `MIGRATION_NOTE.md`. **5 files each.**
* **py-stdio (1 repo): `scam-detector-mcp`**
  same pin + rename + include-list edit, no `mcp-wrapper.py` in the tree, so `server.py` got the note
  block plus the `http_app()` enable path (`ShimASGI(mcp.streamable_http_app(json_response=True))`)
  and the note states `headers N/A at runtime`. **4 files.**
* **TS (3 repos): `retail-ai`, `smart-cities-ai`, `space-ai`**
  `package.json` pins `@modelcontextprotocol/sdk` - **left untouched**: no release of that SDK speaks
  2026-07-28 and inventing a JS pin is forbidden (wave-1 rule). `mcp2026_shim.py` vendored as the
  reference middleware + `//` migration-note block above `async function main()` in `src/index.ts`
  (stdio `StdioServerTransport`, headers N/A at runtime, JS-pin gap stated in code) +
  `MIGRATION_NOTE.md`. **3 files each.**
* **package.json-only stubs (5 repos): `red-team-ops`, `secure-comms`, `sentry-monitoring`,
  `sequential-thinking`, `slack-messaging`**
  each tree is 5 blobs - there is **no server entry point at all** (the declared `dist/index.js` is
  not in the repository). No pin exists to move (JS or Python), so this branch delivers exactly what
  the hard rule allows: vendored `mcp2026_shim.py` + an honest `MIGRATION_NOTE.md`. Nothing
  executable changed. **2 files each.**
* **JS:** no `@modelcontextprotocol/sdk` pin was changed anywhere in this batch - wave-1 rule: no JS
  SDK release speaks 2026-07-28, so any JS pin would be invented.

## 4. Verification receipts

Local audits ran against fully reconstructed trees (every scannable file of the default branch's
`git/trees` listing, fetched via raw.githubusercontent - 0 fetch failures), before patching, after
patching, and with the migration-note text deleted (control):

| state | repos | reading |
|---|---|---|
| before | 16 | `2026-07 / header-add` - the `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (registry token, known false-positive class; all 16 carry `mcp-name-header`), **not** wire code |
| before | 1 | `2025-11 / header-add` - `soc2-compliance-ai-mcp`, which really does declare `protocol-2025-11-25` in code |
| before | 8 | `unknown / header-add` (3 TS + 5 stubs) - the census's honest pre-state |
| **after (this branch)** | **20** | **`2026-07 / handshake-removal`** (17 Python + 3 TypeScript - note-text driven) |
| after (this branch) | 5 | `unknown / header-add` unchanged - package.json-only repos: no scanned surface changed |
| control (note text removed) | 17 | `2026-07 / header-add` |
| control (note text removed) | 8 | `unknown / header-add` |
| control == before | 24/25 | provenance proof, with **one explained exception** below |

Read the `after` rows honestly: the audit tool excludes its own shim (`SELF_FILES`) and does not scan
`.md`, so the new `protocol-2026-07-28` / `mcp-method-header` / `mcp-name-header` / `server-discover`
signals are read from the migration-note text (Python comment block / TS comment block), and
`session-id` is prose about the shim *stripping* that header. Runtime evidence for the wire is the
`mcp>=2.0.0` pin (2.3.0 speaks 2026-07-28) plus the shim at the ingress; `mcp>=2.0.0` alone is not a
wire signal for this scanner. **After-rows are note-text-driven until post-merge re-audit.** The 5
stub rows do not move at all - that is the honest reading, not a pass.

**The one control != before row, stated plainly:** `soc2-compliance-ai-mcp` before = `2025-11 /
header-add`, control = `2026-07 / header-add`. This is not note text leaking into the control: the
recipe moved that repo's `mcp-wrapper.py` served-card declarations (`protocolVersion` /
`mcp_version`) 2025-11-25 -> 2026-07-28, and the scanner reads them as executable signals
(control signals: `protocol-2025-11-25` + `protocol-2026-07-28`). On the other 16 py-http repos the
same wrapper edit is invisible in the control row because their before-era was already `2026-07` via
the agent-card false positive.

* **TS template defect - caught BEFORE any push:** the coordinator warned (from batch 9's Cursor
  Bugbot findings) that the note-block insertion line inherited from `m8_patch.py` ends `tsblock`
  with `async function main()` while the spliced tail starts at the original `)`, producing
  `async function main())`. `m11_patch.py` **did** carry the defect. It was corrected to batch 10's
  form **before the patch stage ran** (`tsblock` ends at `async function main(`, regex loosened to
  `^async function main\(`). Post-patch grep evidence on the three TS trees: **0 occurrences of
  `main())` anywhere**, exactly one `async function main() {` per file (line 67 in all three), the
  banner comment block present exactly once above it. No repair commit was needed: each TS PR is
  3 changed files / 3 commits. Cursor Bugbot read all three PRs and returned **neutral** on each -
  no defect flag.
* **Local syntax gate:** all **96 Python files** across the 25 reconstructed trees (including every
  patched `server.py` / `mcp-wrapper.py`) compile clean under `py_compile` before any push.
* **PR read-back after creation (all 25):** `state: open`, `base: main`, head
  `mcp-2026-wire-header-add`, `changed_files` 5 (16 py-http) / 4 (`scam-detector-mcp`) / 3 (3 TS) /
  2 (5 stubs), and `commits` equals `changed_files` on every repo - one commit per file, no
  interrupted-run debris.
* **Independent body read-back (all 25):** nine required fields checked per body - class
  `header-add` heading, 2027-07-28 deadline, plan link, verify command, before row, after row,
  control row, the caveat line, and the census row. **25/25 present on every PR** (the first pass of
  this check used a wrong needle string for the census line - `Census row: era` vs the body's
  `**Census row:** era`; that pass was discarded, the needle corrected, and a full re-run returned
  `missing: {}`. Tooling slip, not a body gap - same slip batch 9 documented.)
* **Default branches untouched (sampled 5):** `GET contents/MIGRATION_NOTE.md` -> **404** on
  `real-estate-listing-mcp`, `recipe-finder-ai-mcp`, `recruitment-ai-mcp`, `red-team-ops`,
  `regex-ai-mcp`. No push, no force, no merge was made by this lane; every write went through
  `POST git/refs` / `PUT contents` / `POST pulls` on the `mcp-2026-wire-header-add` branch only.
* **CI sampled (6 repos - one per group plus the other two TS):**
  `real-estate-listing-mcp` `test (3.10/3.11/3.12)` success + CodeQL success;
  `scam-detector-mcp` (py-stdio) `test` / `test (3.11)` / `test (3.12)` success;
  `red-team-ops` (stub) Cursor approval + security agents success, no build to run;
  `retail-ai`, `smart-cities-ai`, `space-ai` (TS) Cursor Bugbot **neutral**, approval agent
  success. `Cursor Security Agent` was still `in_progress` (not failed) on `retail-ai`,
  `smart-cities-ai`, `space-ai` and `scam-detector-mcp` at read time. No failing check attributable
  to this branch was observed.
* **422 rule:** implemented pre-emptively - every repo was checked for an open PR with head
  `mcp-2026-wire-header-add` **before any write**, and branch content verified byte-identical (git
  blob SHA-1 of local files vs branch tree) before any body re-PATCH. No pre-existing PR and no
  foreign branch content existed in this slice: **0 pre-existing PRs, 0 re-PATCHes, 0 skips,
  0 content-conflict writes** (push log: zero `SKIP` / `FAIL` / `BACKOFF` lines).

## 5. API budget and rate discipline

* **407 `gh api` calls against the 600 hard cap:** 50 discovery (25 repo meta + 25 recursive
  trees), 278 in the push pass (7 per-repo overhead calls x 25: PR pre-check, branch-tree read,
  head-ref read, ref creation, base-tree read, `POST pulls`, read-back = 175, plus **103
  `PUT contents`** - every intended file on a fresh branch), 36 in the accepted verify
  pass (25 body read-backs, 5 default-branch 404s, 6 CI reads = 3 repos x commits + check-runs), 36 in the discarded
  first verify pass (census-needle slip, reported above), 6 CI follow-up reads (3 repos x commits +
  check-runs), 1 sample body read. `gh api rate_limit` probes (no core-quota cost) read 4721/5000 at
  start and 5000/5000 at the end (the hourly window reset mid-run).
* 0.30 s pacing between calls, 30 s exponential backoff armed for secondary limits: **0
  secondary-limit hits, 0 retries, 0 budget skips, 0 failed gh calls.**
* **Wall time: ~22 minutes** (05:11 BST first-stage start -> 05:33 BST report), inside the 90-minute
  budget. Long stages: discover 3 m 18 s, push 4 m 56 s (296 s), verify ~60 s per pass.

## 6. Known gaps carried forward

* **The TS template defect is fixed in this lane's script only.** Batch 8's four TS PRs
  (`insurance-ai`, `law-enforcement-ai`, `legal-tech-ai`, `maritime-ai`) still carry
  `async function main())` per batch 9's read-only audit - outside this slice, not written to here,
  reported again for the coordinating lane. Batches 12-13 must check their copies of the patch
  script before they run (the defect is one string: `tsblock` must end at `async function main(`).
* The `after` audit rows for the 20 note-bearing repos are note-text-driven: re-audit after merge and
  after a live probe (plan section 6.5) before anyone quotes `migration: none`. The 5 stub rows stay
  `unknown / header-add` until those repositories get a real entry point.
* The 3 TS servers themselves still do not implement the four runbook duties - the branch delivers
  the comment record + reference shim only, because no `@modelcontextprotocol/sdk` release speaks
  2026-07-28 (follow-up stated in all three `MIGRATION_NOTE.md` files).
* The before-era `2026-07` on the 16 Python repos is the `.well-known/agent-card.json` `"mcp_name"`
  token, a scanner false-positive: those repos are **not** evidence of 2026-07-28 wire support
  before this branch. The census row (`unknown / header-add`) is the honest pre-state.
* `soc2-compliance-ai-mcp` is the only repo whose control row differs from its before row - reason
  in section 4; its wrapper's older served declarations are now dual-declared in the file until
  post-merge cleanup.
* Static declaration surfaces (`.well-known/*.json`, `server.json`, `manifest.json`, `README.md`)
  still declare older wires - listed as follow-ups in each `MIGRATION_NOTE.md`, not silent-edited
  (Art. 21: a declaration change gets its own commit).
* Cursor's `Security Agent` check was still running on 4 sampled PRs at report time; a future reader
  should re-read those conclusions rather than assume green.
* The remaining eligible pool is owned by the coordinator (`mig-live-remaining.json`); this lane
  neither claims nor burns any of it beyond its 25.
* No git commit in `~/clawd` from this lane - the parent lane commits this report.

## 7. Artifacts

* `MCP_HEADER_ADD_WAVE2_BATCH11_2026-10-08.md` - this report.
* Per repo, on `mcp-2026-wire-header-add`: `mcp2026_shim.py`, `MIGRATION_NOTE.md`, pinned
  `pyproject.toml`, edited `server.py` (+ `mcp-wrapper.py` on the 16 HTTP repos; + `src/index.ts`
  on the 3 TS repos).
* Scratch (pruned after 24 h): `~/.hermes/cache/scratch/m11_*.py` (discover, before, patch, audit,
  note, push, verify), `m11_*.json`, `m11_*.log`, `m11_table.md`. Reconstructed trees under
  `/tmp/mig11b/` removed on lane exit.
