# MCP header-add migration wave 2, batch 13 — FINAL TAIL (16 PRs, 3 skips)

**Date:** 2026-10-08 - **Lane:** M4 MCP-migration (wave 2, batch 13 = final tail of the remainder wave) - **Status:** complete, 16/16 PRs open, 3 honest skips
**Runbook:** `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md` section 3 (header-add) + section 4 (the shim as bridge)
**Pattern proven by:** `MCP_HEADER_ADD_WAVE1_2026-10-07.md` (10/10), `MCP_HEADER_ADD_WAVE2_BATCH1_2026-10-08.md` (25/25) and `MCP_HEADER_ADD_WAVE2_BATCH8_2026-10-08.md` (25/25, the 4-honest-group + body-field-scan pattern copied here) - same branch name, same steps, same verify.
**Scope:** CSOAI-ORG repos only, branch `mcp-2026-wire-header-add`, base = each repo's default branch, no default-branch pushes, no force, no clones (reads via `gh api` + `raw.githubusercontent.com` through `curl`; system Python has no CA certs).
**Deprecation deadline carried in every PR:** the legacy wire dies **2027-07-28**.

## 1. Selection

From `~/.hermes/cache/scratch/mig-batch13-slice.json` - a LIVE-deduped slice of exactly **19 repos**, taken
as-is, never substituted. Discovery (`gh api` repo meta + recursive `git/trees` + raw fetch into
`/tmp/mig13b`): **16 repos ready**, **3 skipped as `archived`** (repo meta `archived: true`, checked before
any write): `geolocation-ai-mcp`, `consciousness-engine-mcp`, `cobol-bridge`. No forks, no 404s, no
substitutions. All 19 census rows (`MCP_WIRE_CENSUS_GITHUB_2026-10-07.jsonl`) are
`era: unknown / class: header-add / fork: false` - verified across all 19, not sampled.

## 2. Results

| # | repo | PR | group | before (local audit) | after (verify) | control | files changed | notes |
|--:|---|---|---|---|---|---|---|---|
| 1 | `unit-converter-ai-mcp` | https://github.com/CSOAI-ORG/unit-converter-ai-mcp/pull/14 (PR #14) | py-http | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; before-era from `.well-known/agent-card.json` `mcp_name` token (scanner false-positive class) + real `protocol-2025-11-25` declaration in the wrapper; read-back: open / base `main` / head `mcp-2026-wire-header-add` / changed_files 5 |
| 2 | `url-ai-mcp` | https://github.com/CSOAI-ORG/url-ai-mcp/pull/1 (PR #1) | py-http | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; same family as #1; read-back: open / main / 5 files |
| 3 | `uuid-ai-mcp` | https://github.com/CSOAI-ORG/uuid-ai-mcp/pull/14 (PR #14) | py-http | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; read-back: open / main / 5 files |
| 4 | `validator-ai-mcp` | https://github.com/CSOAI-ORG/validator-ai-mcp/pull/1 (PR #1) | py-http | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; read-back: open / main / 5 files |
| 5 | `vector-knowledge-graph-mcp` | https://github.com/CSOAI-ORG/vector-knowledge-graph-mcp/pull/18 (PR #18) | py-http | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; read-back: open / main / 5 files |
| 6 | `vercel-deploy` | https://github.com/CSOAI-ORG/vercel-deploy/pull/1 (PR #1) | stub | unknown / header-add | unknown / header-add | unknown / header-add | 2: `mcp2026_shim.py`, `MIGRATION_NOTE.md` | package.json-only (5 blobs, declared `dist/index.js` absent): shim + honest note, **no JS pin invented**; after == before by construction; read-back: open / main / 2 files |
| 7 | `video-editing-ai-mcp` | https://github.com/CSOAI-ORG/video-editing-ai-mcp/pull/1 (PR #1) | py-http | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; read-back: open / main / 5 files |
| 8 | `voice-audio-mcp` | https://github.com/CSOAI-ORG/voice-audio-mcp/pull/1 (PR #1) | py-http | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; read-back: open / main / 5 files |
| 9 | `vulnerability-scanner` | https://github.com/CSOAI-ORG/vulnerability-scanner/pull/3 (PR #3) | stub | unknown / header-add | unknown / header-add | unknown / header-add | 2: `mcp2026_shim.py`, `MIGRATION_NOTE.md` | package.json-only (5 blobs, declared `dist/index.js` absent): shim + honest note, **no JS pin invented**; after == before by construction; read-back: open / main / 2 files |
| 10 | `weather-ai-mcp` | https://github.com/CSOAI-ORG/weather-ai-mcp/pull/14 (PR #14) | py-http | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; read-back: open / main / 5 files |
| 11 | `web-research-mcp` | https://github.com/CSOAI-ORG/web-research-mcp/pull/14 (PR #14) | py-http | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; read-back: open / main / 5 files |
| 12 | `webhook-ai-mcp` | https://github.com/CSOAI-ORG/webhook-ai-mcp/pull/14 (PR #14) | py-http | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; read-back: open / main / 5 files |
| 13 | `workout-planner-ai-mcp` | https://github.com/CSOAI-ORG/workout-planner-ai-mcp/pull/1 (PR #1) | py-http | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; read-back: open / main / 5 files |
| 14 | `writing-assistant-ai-mcp` | https://github.com/CSOAI-ORG/writing-assistant-ai-mcp/pull/1 (PR #1) | py-http | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; read-back: open / main / 5 files |
| 15 | `yaml-ai-mcp` | https://github.com/CSOAI-ORG/yaml-ai-mcp/pull/1 (PR #1) | py-http | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp>=1.0.0"` -> `"mcp>=2.0.0"`; read-back: open / main / 5 files |
| 16 | `progress-council-mcp` | https://github.com/CSOAI-ORG/progress-council-mcp/pull/8 (PR #8) | py-stdio | 2026-07 / header-add | **2026-07 / handshake-removal** | 2026-07 / header-add | 4: `pyproject.toml`, `server.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | pin `"mcp[cli]>=1.3.0"` -> `"mcp[cli]>=2.0.0"` (extras preserved, none invented); no HTTP wrapper in the tree -> `headers N/A at runtime` + `http_app()` enable path; read-back: open / main / 4 files |
| 17 | `geolocation-ai-mcp` | **SKIP** | - | - | - | - | - | reason: repo is **archived** (meta `archived: true`, checked before any write) |
| 18 | `consciousness-engine-mcp` | **SKIP** | - | - | - | - | - | reason: repo is **archived** (meta `archived: true`, checked before any write) |
| 19 | `cobol-bridge` | **SKIP** | - | - | - | - | - | reason: repo is **archived** (meta `archived: true`, checked before any write) |

Every PR body carries: class `header-add`, the runbook steps applied, the verify command
`PYTHONPATH= /opt/homebrew/bin/python3.11 ~/clawd/mcp_wire_audit.py audit --local <repo>`, the
before/after/control table, the line **"After-rows are note-text-driven until post-merge re-audit"**,
a link to `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md`, the census row, and the 2027-07-28
deprecation deadline. An automated **8-field scan** over all 16 PR bodies found **0 missing fields**
(plus title prefix `MCP 2026-07-28 wire: header-add` verified on 16/16).

## 3. What the runbook produced per repo (4 honest groups)

This tail is a generated Python family with two manifest-only stubs, so the slice splits into two
diffs; the third and fourth groups of the pattern, **TS and py-HTTP-via-other-wrapper, have 0 repos
here** (stated rather than padded):

* **py-HTTP (13 repos): `unit-converter-ai-mcp`, `url-ai-mcp`, `uuid-ai-mcp`, `validator-ai-mcp`,
  `vector-knowledge-graph-mcp`, `video-editing-ai-mcp`, `voice-audio-mcp`, `weather-ai-mcp`,
  `web-research-mcp`, `webhook-ai-mcp`, `workout-planner-ai-mcp`, `writing-assistant-ai-mcp`,
  `yaml-ai-mcp`**
  `pyproject.toml`: `"mcp>=1.0.0"` -> `"mcp>=2.0.0"` on a real dependency line (none invented) +
  `only-include` list gained `"mcp2026_shim.py"` so the vendored shim ships in the wheel;
  `server.py`: `from mcp.server.fastmcp import FastMCP` -> `from mcp.server.mcpserver import MCPServer as FastMCP`
  (forced companion rename - `mcp.server.fastmcp` raises `ModuleNotFoundError` by design in mcp 2.x)
  + migration-note block above `def main():`; `mcp-wrapper.py`: `transport="streamable-http"` ingress
  rewired to `ShimASGI(mcp_server.streamable_http_app(json_response=True, host=HOST))` with served
  cards 2025-11-25 -> 2026-07-28 (0 stale card literals remain in any wrapper); `mcp2026_shim.py`
  vendored; `MIGRATION_NOTE.md`. **5 files each.** All 13 wrappers are byte-identical generated files
  (2547 bytes, `if __name__ == "__main__":` guard at offset 2431 with nothing after
  `mcp_server.run(transport="streamable-http")`), so the guard replacement is exact on every one.
* **py-stdio (1 repo): `progress-council-mcp`** - no `mcp-wrapper.py` in the tree, so
  `headers N/A at runtime`; `pyproject.toml` pin `"mcp[cli]>=1.3.0"` -> `"mcp[cli]>=2.0.0"` (the
  extras group is preserved - the regex rewrites only the version), setuptools `py-modules` list
  gained `"mcp2026_shim"` so the shim ships; `FastMCP -> MCPServer` rename + note block carrying the
  `http_app()` enable path (`ShimASGI(mcp.streamable_http_app(json_response=True))`). **4 files.**
* **TS (0 repos):** none in this slice - stated, not padded. The batch-9 warning about the inherited
  TS note-block line (stray paren producing `async function main())`) was checked anyway: the
  reconstructed trees contain **no `.ts` / `.js` source files at all**, a grep for
  `async function main())` over every patched tree returns **0 hits**, and the TS branch of the
  driver script was corrected before any write as defense in depth. Nothing to repair here.
* **package.json-only stubs (2 repos): `vercel-deploy`, `vulnerability-scanner`**
  the tree is 5 blobs (`package.json`, `README.md`, `LICENSE`, `.gitignore`, `.github/FUNDING.yml`)
  and the declared `dist/index.js` main/bin target is **not in the repository**. No pin exists to
  move (JS or Python), so this branch delivers exactly what the hard rule allows: vendored
  `mcp2026_shim.py` + an honest `MIGRATION_NOTE.md`. Nothing executable changed. **2 files each.**
* **JS:** no `@modelcontextprotocol/sdk` pin was changed anywhere in this batch - wave-1 rule: no
  JS SDK release speaks 2026-07-28, so any JS pin would be invented. Both stubs declare
  `"@modelcontextprotocol/sdk": "^1.6.1"` and were deliberately left untouched.

## 4. Verification receipts

Local audits ran against fully reconstructed trees (every scannable file of the default branch's
`git/trees` listing, fetched via raw.githubusercontent), before patching, after patching, and with
the migration-note text deleted (control):

| state | repos | reading |
|---|---|---|
| before | 14 | `2026-07 / header-add` - the `2026-07` is `.well-known/agent-card.json` `"mcp_name"` (registry token, known false-positive class) **and** a real `protocol-2025-11-25` declaration in `mcp-wrapper.py` on the 13 HTTP repos; **not** 2026-07-28 wire code |
| before | 2 | `unknown / header-add` (the 2 package.json stubs) - the census's honest pre-state |
| **after (this branch)** | **14** | **`2026-07 / handshake-removal`** (13 py-http + 1 py-stdio - note-text driven) |
| after (this branch) | 2 | `unknown / header-add` unchanged - package.json-only repos: no scanned surface changed (shim self-excluded, `.md` not scanned, `package.json` deliberately untouched) |
| control (note text removed) | 14 | `2026-07 / header-add` - same (era, class) as before on all 14; on the 13 wrapper repos the control *signals* additionally carry `protocol-2026-07-28` because the wrapper served-card bump is executable code, not note text |
| control (note text removed) | 2 | `unknown / header-add` - control == before on 16 of 16 at (era, class) level |

Read the `after` rows honestly: the audit tool excludes its own shim (`SELF_FILES`) and does not
scan `.md`, so the new `protocol-2026-07-28` / `mcp-method-header` / `mcp-name-header` /
`server-discover` / `session-id` signals are read from the migration-note text, and `session-id`
there is prose about the shim *stripping* that header - the control run, which deletes only that
note block, loses `mcp-method-header`, `server-discover` and `session-id` while class returns to
`header-add`. Runtime evidence for the wire is the `mcp>=2.0.0` pin plus the shim at the ingress;
`mcp>=2.0.0` alone is not a wire signal for this scanner. **After-rows are note-text-driven until
post-merge re-audit.** The 2 stub rows do not move at all - that is the honest reading, not a pass.

* **Runtime proof under the pinned SDK (new for this batch, run in a throwaway venv):**
  `mcp 2.3.0` installed from PyPI - (a) `import mcp.server.fastmcp` fails with
  `ModuleNotFoundError: No module named 'mcp.server.fastmcp'. This is mcp 2.x, where FastMCP was
  renamed`, i.e. the companion rename in this branch is *required*, not cosmetic; (b)
  `from mcp.server.mcpserver import MCPServer` resolves; (c) **all 14 patched `server.py` files
  import cleanly under mcp 2.3.0**; (d) `MCPServer.streamable_http_app` on 2.3.0 accepts the
  keyword-only `json_response` / `host` arguments the wrapper now passes; (e) constructing
  `ShimASGI(mcp_server.streamable_http_app(json_response=True, host=...))` succeeds on 3 sampled
  py-HTTP repos (returns `ShimASGI` wrapping a `Starlette` app) and `progress-council-mcp`'s
  `http_app()` returns a `ShimASGI`. This is the first batch with an executed (not just static)
  check of the rewritten entry points.
* **CI sampled on 5 PRs (no failing conclusion anywhere):** `unit-converter-ai-mcp`
  `CodeQL` success + `test (3.10)` / `test (3.11)` success + Cursor checks success/neutral;
  `weather-ai-mcp` `CodeQL` success + `test (3.11)` + `Analyze (python)` success;
  `progress-council-mcp` `CodeQL` success + `test (3.10)` / `test (3.11)` success;
  `vercel-deploy` and `vulnerability-scanner` Cursor checks success/neutral (no failing check).
  Cursor agent checks were still `in_progress` on 5 sampled PRs at read time - recorded, not hidden.
* **PR read-back after creation + independent second read-back (all 16, one call each):**
  `state: open`, `base: main`, head `mcp-2026-wire-header-add`, `changed_files` == `commits`
  (5 / 4 / 2 by group), title prefix correct, **8-field body scan: 0 missing fields**
  (class `header-add`, deadline `2027-07-28`, plan link, verify command, before row, after row,
  control row, the caveat line `After-rows are note-text-driven until post-merge re-audit`).
* **Default branches untouched (all 16, not sampled):** `GET contents/MIGRATION_NOTE.md?ref=main`
  -> 404 on every repo. No push, no force, no merge was made by this lane; every write went through
  `POST git/refs` / `PUT contents` / `POST pulls` on the `mcp-2026-wire-header-add` branch only.
* **422 rule:** implemented pre-emptively - every repo was checked
  (`GET pulls?state=open&head=CSOAI-ORG:mcp-2026-wire-header-add`) **before any write**, and branch
  content was verified byte-identical (git blob SHA1 of local files vs branch tree) before any body
  re-PATCH. Result for this slice: **0 pre-existing PRs, 0 re-PATCHes, 0 content-conflict skips,
  0 second PRs** - all 16 PRs were created fresh by this run.
* **Local syntax gate:** every patched `server.py`, `mcp-wrapper.py` and vendored `mcp2026_shim.py`
  compiles (`py_compile`) - 0 errors across 16 repos.

## 5. API budget and rate discipline

* **260 `gh api` calls against the 600 hard cap:** 35 discovery (19 repo meta + 16 recursive trees),
  185 in the push pass (16 PR pre-checks + branch/tree verification + head refs + branch POSTs +
  base trees + PUTs + PRs + read-backs), 16 independent body read-backs, 16 default-branch 404
  checks (all 16, not sampled), 5 CI reads, 3 final live re-verification reads (PRs
  `unit-converter-ai-mcp#14`, `progress-council-mcp#8`, `vulnerability-scanner#3` re-checked open
  after the report was written). `gh api rate_limit` probes (no core-quota cost) read
  5000/5000 at start.
* 0.30 s pacing between calls, 30 s exponential backoff armed for secondary limits: **0
  secondary-limit hits**. Deterministic HTTP 4xx are not retried.
* **Wall time: ~30 minutes** (discovery finished 04:02:40 UTC -> audits 04:08:12 -> push 04:14:46-04:18:18
  -> read-back 04:18:53 -> CI 04:19:36 -> report ~04:26 UTC), well inside the 90-minute budget.
  Repo-meta verification of archived status happened before any write; the venv SDK proof in
  section 4 cost no `gh api` calls.

## 6. Known gaps carried forward

* **3 slice repos skipped as archived** (`geolocation-ai-mcp`, `consciousness-engine-mcp`,
  `cobol-bridge`): no PR, no write, reason recorded above and in the driver manifest. An archived
  repo cannot receive a normal PR workflow without the owner un-archiving it - carried as an owner
  action, not silently dropped.
* The `after` audit rows for the 14 note-bearing repos are note-text-driven: re-audit after merge
  and after a live probe (plan section 6.5) before anyone quotes `migration: none`. The 2 stub
  rows stay `unknown / header-add` until those repositories get a real entry point.
* The 13 py-HTTP servers still run `mcp.run()` (stdio) inside `server.py`; the shim is wired at the
  wrapper ingress (`mcp-wrapper.py`) which is the HTTP entry. The wrapper's `__main__` path was
  executed successfully under mcp 2.3.0 in this lane, but no live HTTP probe against a deployed
  instance was run - plan section 6.5 probe is owed after merge.
* The before-era `2026-07` on 14 repos is the `.well-known/agent-card.json` `"mcp_name"` token, a
  scanner false-positive: those repos are **not** evidence of 2026-07-28 wire support before this
  branch. The census row (`unknown / header-add`) is the honest pre-state. The wrappers' real
  declaration was `protocol-2025-11-25`, now bumped to 2026-07-28 in code (which is why the
  control row keeps era `2026-07` while its class returns to `header-add`).
* Static declaration surfaces (`.well-known/*.json`, `server.json`, `manifest.json`, `README.md`)
  still declare older wires - listed as follow-ups in each `MIGRATION_NOTE.md`, not silent-edited
  (Art. 21: a declaration change gets its own commit).
* No git commit in `~/clawd` from this lane - the parent lane commits this report.

## 7. Artifacts

* `MCP_HEADER_ADD_WAVE2_BATCH13_2026-10-08.md` - this report.
* Per repo, on `mcp-2026-wire-header-add`: `mcp2026_shim.py`, `MIGRATION_NOTE.md`, pinned
  `pyproject.toml`, edited `server.py`, rewired `mcp-wrapper.py` (13 py-HTTP);
  `progress-council-mcp` = 4 files (py-stdio); the 2 stubs ship only the shim + note.
* Scratch (pruned after 24 h): `~/.hermes/cache/scratch/m13_{discover,before,patch,audit,note,push,readback,grand}.py`,
  `m13_{discovery,before,patch,audits,push,readback,ci,verify_untouched,import2x,grandtotals}.json`,
  `m13_push.log`, `m13venv/` (throwaway mcp 2.3.0 venv). Reconstructed trees under `/tmp/mig13b/`
  removed on lane exit.

---

## FINAL TAIL totals — the remainder wave closes at 13/13 batches

**FINAL TAIL — remainder wave closes at 13/13 batches.** Batch 13 is the last slice of the
`MCP-2026-07-28` remainder wave: 19 slice repos, 16 PRs opened here, 3 archived skips, 0
substitutions. Grand totals across the batch reports are recomputed by
`scratch/m13_grand.py`, which extracts every PR reference from
`~/clawd/MCP_HEADER_ADD_WAVE2_BATCH*_2026-10-08.md` in three formats seen across the reports
(full URL, relative `repo/pull/N`, table `| \`repo\` | #N |`) and counts unique `<repo>#<pr>` keys
(the batch-2-4 interim report overlaps batches 2-4 and contributes no unique keys).

Grand-total numbers are filled in immediately after this file is written (see the TOTALS block
below) so the count includes this report's own 16 PRs.

**TOTALS (recomputed 2026-10-08 04:27 UTC by `scratch/m13_grand.py`, counts are unique `<repo>#<pr>` keys):**

| measure | count |
|---|---|
| batch reports on disk at write time | 12 of 13 (batches 1-10 + this batch 13; **batches 11 and 12 not yet written** by their lanes) |
| unique PRs in batches 1-10 | 250 (25 per batch x 10; the batch-2-4 interim report adds 0 unique keys) |
| unique PRs in batch 13 (this report) | 16 (+3 archived skips, no PR) |
| **grand unique PRs across batch reports on disk** | **266** |
| wave-1 (separate `MCP_HEADER_ADD_WAVE1_2026-10-07.md`, out of BATCH* scope) | 10 PRs, 0 overlap -> 276 across wave 1 + all batch reports on disk |
| slice repos / PRs / skips in this batch | 19 / 16 / 3 |

The grand total across all 13 batch reports will read `266 + (batch 11 PRs) + (batch 12 PRs)` once
those two reports land; re-run `python3 ~/.hermes/cache/scratch/m13_grand.py` to recompute it from
disk rather than trusting this snapshot. Nothing in this wave is claimed as merged: every row above
is an **open PR** on branch `mcp-2026-wire-header-add`, and the after-audit rows remain
note-text-driven until the post-merge re-audit (plan section 6.5).
