# MCP wire census — CSOAI-ORG GitHub organisation

**Date:** 2026-10-07 · **Lane:** M4 MCP-census · **Status:** complete  
**Companion to:** `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md` §6 phase 3 (the ~239-server census gap)  
**Method:** read-only (`gh api` GET + raw file fetch), no clone, no writes, depth-capped, budget-capped

## 1. Headline

* **516 of 754** repos match the MCP candidate rule (name contains `mcp`, or description matches
  `\bmcp\b` / *Model Context Protocol*). 238 repos never mention MCP and were skipped by the filter.
* **422 owned (non-fork) repos are confirmed MCP servers** — corroborated by a manifest, an
  entry source file or an SDK import, per the same corroboration rule as `mcp_wire_audit.py`.
* **0 of them carry the 2026-07-28 wire.** Across the 1,627 files read, no file uses `Mcp-Method` / `Mcp-Name` as a header, exposes `server/discover`, or pins `protocolVersion` to `2026-07-28` (`both_headers=0`, `mcp-method-header=0`, `server-discover=0`). The `2026-07-28` strings that do exist are prose dates — a spec-RC blog link and test/measurement dates — see §7.
* **421 owned repos need `header-add`, 1 needs `full`** (pin a modern
  protocol version *and* remove handshake code). Nobody is in `none`.
* 3 repos pin an explicitly older protocol version; everything else is `unknown` (SDK-mediated: `mcp>=1.0.0` is unpinned in `pyproject.toml`, so source cannot record the wire).

## 2. Scope and how it was read

| stage | what | count | cost |
|---|---|---:|---|
| organisation listing | `gh api --paginate users/CSOAI-ORG/repos` | 754 repos | 8 GET |
| candidate filter | name contains `mcp`, or description matches `\bmcp\b` / *Model Context Protocol* | 516 | — |
| — of which forks | upstream mirrors (awesome lists, tooling) | 34 | — |
| deep pass | full `git/trees/HEAD?recursive=1` + ≤4 chosen files (manifest, entry source, README) | 150 | 150 GET + raw |
| shallow pass | README + ≤18 guessed entry paths (`pyproject.toml`, `server.py`, `src/…`) | 366 | 0 GET (raw only) |
| files actually read | (evidence corpus, all sizes capped at 1 MiB) | 1627 | — |
| `gh api` invocations | deep trees + list/exploration calls | ≈345 (≈361 HTTP GET) | budget was 400 |
| raw fetches | `raw.githubusercontent.com` (no API quota) | ≈9550 attempted, 1627 kept | — |

The deep set is the 150 most-recently-updated candidates; the shallow set gets a README plus guessed
common entry paths, so a shallow `unknown` means "no version pin found in what we could read", not "no pin exists".

## 3. Era distribution

| era | all candidates | owned (non-fork) | deep pass | shallow pass |
|---|---:|---:|---:|---:|
| `pre-2025-06` | 1 | 1 | 1 | 0 |
| `2025-06` | 1 | 1 | 1 | 0 |
| `2025-11` | 1 | 0 | 1 | 0 |
| `2026-07` | 2 | 0 | 2 | 0 |
| `unknown` | 437 | 420 | 83 | 354 |
| `not-mcp` | 68 | 54 | 57 | 11 |
| `unreadable` | 6 | 6 | 5 | 1 |
| **total** | **516** | **482** | **150** | **366** |

`not-mcp` = candidate whose tree/README shows no server implementation (awesome lists, agent-card /
`.well-known` metadata repos, blog and profile repos). `unreadable` = empty repo (3 × HTTP 409) or
nothing fetchable (3).

Evidence depth behind each record:

| evidence_kind | records | meaning |
|---|---:|---|
| `source` | 431 | a manifest or entry source file produced the signals |
| `docs` | 13 | only a README produced signals — doc-level, weakest |
| `none` | 72 | read but no MCP signal at all (`not-mcp` / `unreadable`) |

## 4. Migration classes

| migration class | all candidates | owned (non-fork, confirmed MCP) |
|---|---:|---:|
| `none` | 0 | 0 |
| `header-add` | 438 | 421 |
| `handshake-removal` | 0 | 0 |
| `full` | 4 | 1 |
| `n/a` | 74 | 0 |

Same four classes as the local audit: `none` already speaks 2026-07-28 with both mandatory headers and
no handshake code; `header-add` only lacks `Mcp-Method`/`Mcp-Name`; `handshake-removal` has the headers
but raw `initialize`/session code; `full` needs both or is pinned pre-2025-06.

### Repos pinned to an explicitly older wire

| repo | era | migration | fork | evidence |
|---|---|---|---|---|
| `awesome-claude-code-plugins` | 2025-11 | full | yes | `plugins/magic-cc-codex-worker/dist/index.js` |
| `csoai-mcp-dist` | pre-2025-06 | full | no | `server.js` |
| `mcp-spec-compliance-mcp` | 2025-06 | header-add | no | `server.py` |

Evidence quality behind those three calls, read literally:

* `csoai-mcp-dist` — **real pin**: `server.js` answers `protocolVersion: '2024-11-05'` to `initialize`.
* `awesome-claude-code-plugins` (fork) — bundled SDK dist declares `LATEST_PROTOCOL_VERSION = 2025-11-25`.
* `mcp-spec-compliance-mcp` — the `2025-06-18` literal sits in the module docstring's spec-revision
  list, not in a `protocolVersion` value: treat its era as prose-level, i.e. `unknown` in practice.

## 5. Top-10 to migrate first

Ranked: migration severity (`full` > `header-add`) → era urgency (pre-2025-06 > 2025-11 > 2025-06 >
unknown > 2026-07) → most recently updated. Forks and README-only evidence excluded, so this is the
owned backlog.

| # | repo | era | migration | updated | in local baseline | key signals |
|---:|---|---|---|---|---|---|
| 1 | `csoai-mcp-dist` | pre-2025-06 | full | 2026-09-15 | no | `initialize-handshake, protocol-2024-11-05` |
| 2 | `mcp-spec-compliance-mcp` | 2025-06 | header-add | 2026-09-05 | no | `protocol-2025-06-18, sdk-fastmcp, sdk-mcp-import` |
| 3 | `csoai-defoneos-mcp` | unknown | header-add | 2026-09-16 | no | `sdk-fastmcp, sdk-mcp-import` |
| 4 | `blizzard-wow-mcp` | unknown | header-add | 2026-09-15 | no | `sdk-mcp-import` |
| 5 | `mmoagent-mcp` | unknown | header-add | 2026-09-15 | no | `sdk-mcp-import` |
| 6 | `dora-compliance-mcp` | unknown | header-add | 2026-09-13 | no | `sdk-fastmcp, sdk-mcp-import` |
| 7 | `eu-ai-act-compliance-mcp` | unknown | header-add | 2026-09-13 | no | `sdk-fastmcp, sdk-mcp-import` |
| 8 | `gdpr-compliance-ai-mcp` | unknown | header-add | 2026-09-13 | no | `sdk-fastmcp, sdk-mcp-import` |
| 9 | `acord-bridge-mcp` | unknown | header-add | 2026-09-10 | no | `sdk-fastmcp, sdk-mcp-import` |
| 10 | `as400-bridge-mcp` | unknown | header-add | 2026-09-10 | no | `sdk-fastmcp, sdk-mcp-import` |

## 6. Gap against the local baseline

* The local audit holds 132 server roots; 12 candidate **repo names** match one of them by name (repo name ≠ server directory name, so this is a floor, not a join).
* **413 of 422 owned confirmed MCP repos** have no name match in the local baseline. Treat as an upper bound on the phase-3 gap: one repo can host several servers, and monorepo-hosted local roots (e.g. `councilof-ai-monorepo`) share a single repo name.
* The migration plan's ~239-server figure counts *servers*; this census counts *repos*. They are not interchangeable and neither should be added to the other.

## 7. Known false-positive calls (both flagged, both forks)

Two records read as `2026-07` and neither is wire evidence:

* **`awesome-harness-engineering`** — evidence: `README.md`. README links the 2026-07-28 spec release-candidate blog post (prose date, not a pin).
* **`registry`** — evidence: `internal/validators/registries/mcpb.go`, `internal/validators/registries/mcpname.go`. validator source parses the proofof.ai ownership token `mcp-name: …`, it does not emit the header.

A systematic false positive was found and removed during this run: every CSOAI README carries
proofof.ai's **ownership token** `mcp-name: io.github.CSOAI-ORG/<repo>` (as an HTML comment *or* plain
text). It matched the `mcp-name-header` signal and originally inflated `2026-07` to **116** records.
`registry/internal/validators/registries/mcpname.go` documents the token, which is how it was
confirmed as non-wire. Both forms are now stripped before signal extraction, together with HTML
comments. Without that fix the census would have claimed ~118 repos are already on the new wire.

Related: `gspc-harness` contains two `2026-07-28` date strings in task comments, but no MCP core
signal at all, so it is recorded `not-mcp` (era decided only after corroboration), never `2026-07`.

Caveats carried forward, not smoothed over:

* The candidate filter can miss a server whose repo name/description never says MCP (238 repos skipped).
* Shallow records rest on README + guessed paths; a shallow `unknown` is weaker than a deep `unknown`.
* `unknown` is the honest majority answer, exactly as in the local audit: unpinned SDK dependency.
* Era evidence comes from ≤4 files per deep repo (depth-capped), not from executing anything.

## 8. Rate-limit usage

* `gh api` invocations across this lane: **≈345** (≈361 HTTP GETs incl. paginated list calls), against the 400-call self-imposed cap. 330 of them were the deep-pass tree listings across two full runs (the first run's raw fetch failed on a local TLS issue and had to be re-run); trees were then disk-cached so later re-classifications cost 0 calls.
* `gh api rate_limit` reported core `5000/5000 remaining` at every probe — GitHub's counter for this token never moved, so the numbers above are counted in-process, not read from the API.
* 0 secondary-rate-limit hits; one 30 s backoff hook was armed but never fired.
* All file content came from `raw.githubusercontent.com` (outside API quota), 10 concurrent fetches.
* Write budget: read-only on GitHub — no commits, no PRs, no repo mutations.

## 9. Artifacts

| file | contents |
|---|---|
| `MCP_WIRE_CENSUS_GITHUB_2026-10-07.jsonl` | 516 records: `repo, era, signals, migration, checked_at, depth, fork, updated, evidence, files_read, evidence_kind, local_baseline` |
| `MCP_WIRE_CENSUS_REPORT_2026-10-07.md` | this report |

Driver scripts (scratch dir — Hermes prunes idle scratch files after 24 h, copy them if you want to keep them):

* `/Users/nicholas/.hermes/cache/scratch/gh_census.py` — listing, tree pass, raw fetch, classify (imports
  `~/clawd/mcp_wire_audit.py`, so the four migration classes and the era vocabulary are identical).
* `/Users/nicholas/.hermes/cache/scratch/gh_census_supplement.py` — second source-file probe for deep
  repos that looked `not-mcp` on README evidence alone.
* `/Users/nicholas/.hermes/cache/scratch/make_report.py` — this document.

Re-running `gh_census.py` needs no API spend for content: trees and file contents are disk-cached, so it
costs 9 API calls (three repos are permanently empty) and rewrites both artifacts from the same evidence.
