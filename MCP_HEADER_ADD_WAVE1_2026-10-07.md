# MCP header-add migration wave - census top-10 (PRs opened)

**Date:** 2026-10-07 - **Lane:** M4 MCP-migration (wave 2, EAT mode) - **Status:** complete, 10/10 PRs open  
**Runbook:** `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md` section 3 (header-add) + section 4 (shim wiring)  
**Scope:** CSOAI-ORG repos only, branch `mcp-2026-wire-header-add` per repo, base = each repo's default branch, no default-branch pushes, no force, no clone (reads via `gh api` + `raw.githubusercontent.com`).  
**Deprecation deadline carried in every PR:** the legacy wire dies **2027-07-28**.

## 1. Results

| # | repo | PR | era/migration before | era/migration after (verify) | files changed | notes |
|---:|---|---|---|---|---|---|
| 1 | `csoai-mcp-dist` | CSOAI-ORG/csoai-mcp-dist/pull/1 | census pre-2025-06 / full<br>local `pre-2025-06` / `full` | `pre-2025-06` / `full` | 2: `mcp2026_shim.py`, `MIGRATION_NOTE.md` | census class **`full`**: no SDK dependency line exists to pin (`package.json` has none) and the transport is raw stdio JSON-RPC - header-add has nothing further to apply, handshake-removal still owed, audit deliberately unchanged; CI: no test workflow (Cursor agents only) |
| 2 | `mcp-spec-compliance-mcp` | CSOAI-ORG/mcp-spec-compliance-mcp/pull/1 | census 2025-06 / header-add<br>local `2026-07` / `header-add` | `2026-07` / `handshake-removal` | 4: `pyproject.toml`, `server.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | stdio-only: pin + vendored shim + `http_app()` enable path + note; CI: test 3.10/3.11 pass |
| 3 | `csoai-defoneos-mcp` | CSOAI-ORG/csoai-defoneos-mcp/pull/1 | census unknown / header-add<br>local `unknown` / `header-add` | `2026-07` / `handshake-removal` | 4: `pyproject.toml`, `csoai_defoneos_mcp/server.py`, `csoai_defoneos_mcp/mcp2026_shim.py`, `MIGRATION_NOTE.md` | shim vendored inside the package (hatch `packages=[...]`); low-level `Server` API unchanged in mcp 2.x; CI: build + verify pass |
| 4 | `blizzard-wow-mcp` | CSOAI-ORG/blizzard-wow-mcp/pull/1 | census unknown / header-add<br>local `unknown` / `header-add` | `unknown` / `header-add` | 2: `mcp2026_shim.py`, `MIGRATION_NOTE.md` | no JS SDK release speaks 2026-07-28 (verified `@modelcontextprotocol/sdk@1.32.1` -> `LATEST_PROTOCOL_VERSION = '2025-11-25'`); no pin invented, no 2026 claim made; CI: build pass |
| 5 | `mmoagent-mcp` | CSOAI-ORG/mmoagent-mcp/pull/1 | census unknown / header-add<br>local `unknown` / `header-add` | `unknown` / `header-add` | 2: `mcp2026_shim.py`, `MIGRATION_NOTE.md` | no JS SDK release speaks 2026-07-28 (verified `@modelcontextprotocol/sdk@1.32.1` -> `LATEST_PROTOCOL_VERSION = '2025-11-25'`); no pin invented, no 2026 claim made; CI: build pass |
| 6 | `dora-compliance-mcp` | CSOAI-ORG/dora-compliance-mcp/pull/20 | census unknown / header-add<br>local `2026-07` / `header-add` | `2026-07` / `handshake-removal` | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | streamable-HTTP ingress **wired** (`ShimASGI(streamable_http_app(json_response=True))`); v1 `settings.host` lines replaced (field gone in mcp 2.x); served well-known cards bumped 2025-11-25 -> 2026-07-28; CI: test 3.10/3.11 pass |
| 7 | `eu-ai-act-compliance-mcp` | CSOAI-ORG/eu-ai-act-compliance-mcp/pull/28 | census unknown / header-add<br>local `2026-07` / `header-add` | `2026-07` / `handshake-removal` | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | streamable-HTTP ingress **wired** (`ShimASGI(streamable_http_app(json_response=True))`); v1 `settings.host` lines replaced (field gone in mcp 2.x); served well-known cards bumped 2025-11-25 -> 2026-07-28; CI: test 3.10/3.11/3.12 pass |
| 8 | `gdpr-compliance-ai-mcp` | CSOAI-ORG/gdpr-compliance-ai-mcp/pull/22 | census unknown / header-add<br>local `2025-11` / `header-add` | `2026-07` / `handshake-removal` | 5: `pyproject.toml`, `server.py`, `mcp-wrapper.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | streamable-HTTP ingress **wired** (`ShimASGI(streamable_http_app(json_response=True))`); v1 `settings.host` lines replaced (field gone in mcp 2.x); served well-known cards bumped 2025-11-25 -> 2026-07-28; CI: test 3.10/3.11/3.12 pass |
| 9 | `acord-bridge-mcp` | CSOAI-ORG/acord-bridge-mcp/pull/7 | census unknown / header-add<br>local `unknown` / `header-add` | `2026-07` / `handshake-removal` | 4: `pyproject.toml`, `server.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | stdio-only: pin + vendored shim + `http_app()` enable path + note; CI: test pass |
| 10 | `as400-bridge-mcp` | CSOAI-ORG/as400-bridge-mcp/pull/7 | census unknown / header-add<br>local `unknown` / `header-add` | `2026-07` / `handshake-removal` | 4: `pyproject.toml`, `server.py`, `mcp2026_shim.py`, `MIGRATION_NOTE.md` | stdio-only: pin + vendored shim + `http_app()` enable path + note; CI: test pass |

Every PR body carries: class `header-add`, the runbook steps applied, the verify command `PYTHONPATH= /opt/homebrew/bin/python3.11 ~/clawd/mcp_wire_audit.py audit --local <repo>`, the before/after/control table, a link to `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md` and the 2027-07-28 deprecation deadline.

**Skipped repos: none.** All 10 exist, none archived, none forks; 9 had an editable manifest, and `csoai-mcp-dist` got an honest no-SDK pin documented instead of an invented one.

## 2. What the runbook produced per repo

* **Python (7):** `mcp>=1.0.0` / `mcp[cli]>=1.3.0` / `mcp>=1.0.0,<2.0.0` -> **`mcp>=2.0.0`** (2.3.0 is the current 2026-07-28 SDK), the forced companion rename `from mcp.server.fastmcp import FastMCP` -> `from mcp.server.mcpserver import MCPServer as FastMCP` (`mcp.server.fastmcp` raises `ModuleNotFoundError` by design in 2.x - without it the pin would not import), the 665-line stdlib `mcp2026_shim.py` vendored and added to the packaging include list, a migration note at the entry point, and `MIGRATION_NOTE.md`.
* **HTTP-exposed (3 of the 7 - `dora`, `eu-ai-act`, `gdpr`):** real transport wiring in `mcp-wrapper.py` - `ShimASGI(mcp_server.streamable_http_app(json_response=True))` fronts every ingress request with `translate_request` (validates `Mcp-Method`/`Mcp-Name`, injects `params._meta.protocolVersion = "2026-07-28"`, strips `Mcp-Session-Id`, answers legacy `initialize`/`server/discover` locally). `json_response=True` because the shim buffers bodies - SSE through the wrapper is explicitly out of scope (plan section 4).
* **JS (2) + raw stdio JS (1):** shim vendored + `MIGRATION_NOTE.md` only; **no manifest line was invented** - see the table notes.

## 3. Verification receipts

* Local audits ran against a fully reconstructed tree per repo (every scannable file in the default branch's `git/trees` listing, fetched via `raw.githubusercontent.com`), before and after patching:

| repo | before | after | control (note block removed) |
|---|---|---|---|
| `csoai-mcp-dist` | `pre-2025-06` / `full` | `pre-2025-06` / `full` | `-` / `-` |
| `mcp-spec-compliance-mcp` | `2026-07` / `header-add` | `2026-07` / `handshake-removal` | `2026-07` / `header-add` |
| `csoai-defoneos-mcp` | `unknown` / `header-add` | `2026-07` / `handshake-removal` | `unknown` / `header-add` |
| `blizzard-wow-mcp` | `unknown` / `header-add` | `unknown` / `header-add` | `-` / `-` |
| `mmoagent-mcp` | `unknown` / `header-add` | `unknown` / `header-add` | `-` / `-` |
| `dora-compliance-mcp` | `2026-07` / `header-add` | `2026-07` / `handshake-removal` | `2026-07` / `header-add` |
| `eu-ai-act-compliance-mcp` | `2026-07` / `header-add` | `2026-07` / `handshake-removal` | `2026-07` / `header-add` |
| `gdpr-compliance-ai-mcp` | `2025-11` / `header-add` | `2026-07` / `handshake-removal` | `2026-07` / `header-add` |
| `acord-bridge-mcp` | `unknown` / `header-add` | `2026-07` / `handshake-removal` | `unknown` / `header-add` |
| `as400-bridge-mcp` | `unknown` / `header-add` | `2026-07` / `handshake-removal` | `unknown` / `header-add` |

Read the `after` column honestly: the audit tool **excludes its own shim** (`SELF_FILES`) and does not scan `.md`, so the new `protocol-2026-07-28` / `mcp-method-header` / `mcp-name-header` / `server-discover` signals are read from the migration-note text in the entry file, and the `session-id` signal is prose about the shim *stripping* that header - not session code. The control run (deleting only that note block) drops back to the before state with no `session-id`, which proves the provenance. Runtime evidence for the wire is the `mcp>=2.0.0` SDK (2.3.0 speaks 2026-07-28) plus the wired shim; `mcp>=2.0.0` alone is not a wire signal for this scanner.
* **CI green on every PR that runs checks:** `mcp-spec`, `dora`, `eu-ai-act`, `gdpr` test suites pass on Python 3.10/3.11/3.12 *with the 2.x pin and the renamed import*, `acord`/`as400` tests pass, `csoai-defoneos` build+verify pass, `blizzard`/`mmoagent` `tsc` build pass - the real compatibility proof for the FastMCP -> MCPServer rename.
* PR read-back after creation: all 10 `state: open`, correct base branch, `changed_files` 2-5, head `mcp-2026-wire-header-add` on each; branch file contents spot-checked (pinned `pyproject.toml`, `ShimASGI` in `mcp-wrapper.py`, `MIGRATION_NOTE.md`).

## 4. API budget

* `gh api` REST calls for the whole task: **~121** against the 300 hard cap - 30 discovery/tree calls, 87 in the push script (10 base-ref reads, 10 branch creations, 42 content PUTs, 10 PR creations plus read-backs), ~40 verification/correction reads (`pulls/<n>` read-backs, raw content spot-checks, `gh pr checks`, 3 PR-body corrections for the JS/no-SDK repos).
* 0.25 s pacing between calls, 30 s backoff armed for secondary limits: **0 secondary-limit hits**.
* Rate-limit probe at start: core 5000/5000. No writes outside `CSOAI-ORG/*` branches, no commits to any default branch, no secrets, no clones.

## 5. Known gaps carried forward

* `csoai-mcp-dist` is census class `full` (era `pre-2025-06`, raw `initialize` answering `2024-11-05`): the handshake-removal half of the runbook is separate work; its audit row is intentionally unchanged.
* The two JS repos cannot move until `@modelcontextprotocol/sdk` ships a 2026-07-28 release; until then the honest estate claim stays `wire version unpinned` / max `2025-11-25`.
* Static declaration surfaces (`server.json` `$schema`, `.well-known/*`, `README.md`, `gdpr-compliance-ai-mcp/.well-known/mcp/server-card.json` `protocol_version: 2025-11-25`) still declare older wires - listed as follow-ups in each `MIGRATION_NOTE.md`, not silent-edited (Art. 21: a declaration change gets its own commit).
* The `after` audit rows are note-text-driven (section 3): re-audit after merge and after a live probe (plan section 6.5) before anyone quotes `migration: none`.

## 6. Artifacts

* `MCP_HEADER_ADD_WAVE1_2026-10-07.md` - this report (parent lane commits it).
* Per repo, on `mcp-2026-wire-header-add`: `mcp2026_shim.py`, `MIGRATION_NOTE.md`, pinned `pyproject.toml`, edited entry (`server.py` / `mcp-wrapper.py` / `csoai_defoneos_mcp/server.py`).
* Scratch (pruned after 24 h): `~/.hermes/cache/scratch/{apply_header_add.py, push_header_add.py, mig_*.json, audit_*.json}`.
