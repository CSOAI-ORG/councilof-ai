#!/usr/bin/env python3
"""Build MCP_WIRE_CENSUS_REPORT_2026-10-07.md from the census JSONL."""
from __future__ import annotations

import collections
import json

JSONL = "/Users/nicholas/clawd/MCP_WIRE_CENSUS_GITHUB_2026-10-07.jsonl"
OUT = "/Users/nicholas/clawd/MCP_WIRE_CENSUS_REPORT_2026-10-07.md"
CANON = ("pre-2025-06", "2025-06", "2025-11", "2026-07", "unknown")
ERA_ORDER = ["pre-2025-06", "2025-06", "2025-11", "2026-07", "unknown", "not-mcp", "unreadable"]
MIG_ORDER = ["none", "header-add", "handshake-removal", "full", "n/a"]

API_GH_API_GETS = 345          # gh api invocations counted across this lane's runs
API_HTTP = 361                 # incl. paginated multi-request list calls
RAW_ATTEMPTS = 9550            # raw fetches across all runs (404 paths re-attempted each run)
RAW_KEPT = 1627

recs = [json.loads(l) for l in open(JSONL)]
owned = [r for r in recs if not r["fork"]]
deep = [r for r in recs if r["depth"] == "deep"]
shallow = [r for r in recs if r["depth"] == "shallow"]
conf = [r for r in recs if r["era"] in CANON]
owned_conf = [r for r in owned if r["era"] in CANON]

era_all = collections.Counter(r["era"] for r in recs)
era_owned = collections.Counter(r["era"] for r in owned)
era_deep = collections.Counter(r["era"] for r in deep)
era_shallow = collections.Counter(r["era"] for r in shallow)
mig_all = collections.Counter(r["migration"] for r in recs)
mig_owned = collections.Counter(r["migration"] for r in owned_conf)
ev_kind = collections.Counter(r["evidence_kind"] for r in recs)

sev = {"full": 3, "handshake-removal": 2, "header-add": 1, "none": 0}
urg = {"pre-2025-06": 5, "2025-11": 4, "2025-06": 3, "unknown": 2, "2026-07": 1}
pool = [r for r in owned if r["era"] in CANON and r["migration"] != "none" and r["evidence_kind"] == "source"]
pool.sort(key=lambda r: (-sev[r["migration"]], -urg[r["era"]],
                         -int(r["updated"][:4] + r["updated"][5:7] + r["updated"][8:10])))
top = pool[:10]

flagged = [r for r in recs if r["era"] == "2026-07"]
both_headers = sum(1 for r in conf if {"mcp-method-header", "mcp-name-header"} <= set(r["signals"]))
has_method = sum(1 for r in conf if "mcp-method-header" in r["signals"])
has_discover = sum(1 for r in conf if "server-discover" in r["signals"])
legacy = [r for r in recs if r["era"] in ("pre-2025-06", "2025-06", "2025-11")]
local_overlap = sum(r["local_baseline"] for r in recs)

L: list[str] = []
A = L.append

A("# MCP wire census — CSOAI-ORG GitHub organisation")
A("")
A("**Date:** 2026-10-07 · **Lane:** M4 MCP-census · **Status:** complete  ")
A("**Companion to:** `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md` §6 phase 3 (the ~239-server census gap)  ")
A("**Method:** read-only (`gh api` GET + raw file fetch), no clone, no writes, depth-capped, budget-capped")
A("")
A("## 1. Headline")
A("")
A(f"* **{len(recs)} of 754** repos match the MCP candidate rule (name contains `mcp`, or description matches")
A("  `\\bmcp\\b` / *Model Context Protocol*). 238 repos never mention MCP and were skipped by the filter.")
A(f"* **{len(owned_conf)} owned (non-fork) repos are confirmed MCP servers** — corroborated by a manifest, an")
A("  entry source file or an SDK import, per the same corroboration rule as `mcp_wire_audit.py`.")
A(f"* **0 of them carry the 2026-07-28 wire.** Across the {RAW_KEPT:,} files read, no file uses "
  "`Mcp-Method` / `Mcp-Name` as a header, exposes `server/discover`, or pins `protocolVersion` to "
  f"`2026-07-28` (`both_headers={both_headers}`, `mcp-method-header={has_method}`, "
  f"`server-discover={has_discover}`). The `2026-07-28` strings that do exist are prose dates — a "
  "spec-RC blog link and test/measurement dates — see §7.")
A(f"* **{mig_owned['header-add']} owned repos need `header-add`, {mig_owned['full']} needs `full`** (pin a modern")
A("  protocol version *and* remove handshake code). Nobody is in `none`.")
A(f"* {len(legacy)} repos pin an explicitly older protocol version; everything else is `unknown` "
  "(SDK-mediated: `mcp>=1.0.0` is unpinned in `pyproject.toml`, so source cannot record the wire).")
A("")
A("## 2. Scope and how it was read")
A("")
A("| stage | what | count | cost |")
A("|---|---|---:|---|")
A("| organisation listing | `gh api --paginate users/CSOAI-ORG/repos` | 754 repos | 8 GET |")
A("| candidate filter | name contains `mcp`, or description matches `\\bmcp\\b` / *Model Context Protocol* | 516 | — |")
A("| — of which forks | upstream mirrors (awesome lists, tooling) | 34 | — |")
A("| deep pass | full `git/trees/HEAD?recursive=1` + ≤4 chosen files (manifest, entry source, README) | 150 | 150 GET + raw |")
A("| shallow pass | README + ≤18 guessed entry paths (`pyproject.toml`, `server.py`, `src/…`) | 366 | 0 GET (raw only) |")
A("| files actually read | (evidence corpus, all sizes capped at 1 MiB) | " + str(sum(r["files_read"] for r in recs)) + " | — |")
A(f"| `gh api` invocations | deep trees + list/exploration calls | ≈{API_GH_API_GETS} (≈{API_HTTP} HTTP GET) | budget was 400 |")
A(f"| raw fetches | `raw.githubusercontent.com` (no API quota) | ≈{RAW_ATTEMPTS} attempted, {RAW_KEPT} kept | — |")
A("")
A("The deep set is the 150 most-recently-updated candidates; the shallow set gets a README plus guessed")
A("common entry paths, so a shallow `unknown` means \"no version pin found in what we could read\", "
  "not \"no pin exists\".")
A("")
A("## 3. Era distribution")
A("")
A("| era | all candidates | owned (non-fork) | deep pass | shallow pass |")
A("|---|---:|---:|---:|---:|")
for e in ERA_ORDER:
    A(f"| `{e}` | {era_all[e]} | {era_owned[e]} | {era_deep[e]} | {era_shallow[e]} |")
A(f"| **total** | **{len(recs)}** | **{len(owned)}** | **{len(deep)}** | **{len(shallow)}** |")
A("")
A("`not-mcp` = candidate whose tree/README shows no server implementation (awesome lists, agent-card /")
A("`.well-known` metadata repos, blog and profile repos). `unreadable` = empty repo (3 × HTTP 409) or")
A("nothing fetchable (3).")
A("")
A("Evidence depth behind each record:")
A("")
A("| evidence_kind | records | meaning |")
A("|---|---:|---|")
A(f"| `source` | {ev_kind['source']} | a manifest or entry source file produced the signals |")
A(f"| `docs` | {ev_kind['docs']} | only a README produced signals — doc-level, weakest |")
A(f"| `none` | {ev_kind['none']} | read but no MCP signal at all (`not-mcp` / `unreadable`) |")
A("")
A("## 4. Migration classes")
A("")
A("| migration class | all candidates | owned (non-fork, confirmed MCP) |")
A("|---|---:|---:|")
for m in MIG_ORDER:
    A(f"| `{m}` | {mig_all[m]} | {mig_owned[m] if m in mig_owned else 0} |")
A("")
A("Same four classes as the local audit: `none` already speaks 2026-07-28 with both mandatory headers and")
A("no handshake code; `header-add` only lacks `Mcp-Method`/`Mcp-Name`; `handshake-removal` has the headers")
A("but raw `initialize`/session code; `full` needs both or is pinned pre-2025-06.")
A("")
A("### Repos pinned to an explicitly older wire")
A("")
A("| repo | era | migration | fork | evidence |")
A("|---|---|---|---|---|")
for r in sorted(legacy, key=lambda x: x["repo"]):
    ev = ", ".join(r["evidence"])[:60]
    A(f"| `{r['repo']}` | {r['era']} | {r['migration']} | {'yes' if r['fork'] else 'no'} | `{ev}` |")
A("")
A("Evidence quality behind those three calls, read literally:")
A("")
A("* `csoai-mcp-dist` — **real pin**: `server.js` answers `protocolVersion: '2024-11-05'` to `initialize`.")
A("* `awesome-claude-code-plugins` (fork) — bundled SDK dist declares `LATEST_PROTOCOL_VERSION = 2025-11-25`.")
A("* `mcp-spec-compliance-mcp` — the `2025-06-18` literal sits in the module docstring's spec-revision")
A("  list, not in a `protocolVersion` value: treat its era as prose-level, i.e. `unknown` in practice.")
A("")
A("## 5. Top-10 to migrate first")
A("")
A("Ranked: migration severity (`full` > `header-add`) → era urgency (pre-2025-06 > 2025-11 > 2025-06 >")
A("unknown > 2026-07) → most recently updated. Forks and README-only evidence excluded, so this is the")
A("owned backlog.")
A("")
A("| # | repo | era | migration | updated | in local baseline | key signals |")
A("|---:|---|---|---|---|---|---|")
for i, r in enumerate(top, 1):
    sig = ", ".join(r["signals"])[:52]
    A(f"| {i} | `{r['repo']}` | {r['era']} | {r['migration']} | {r['updated'][:10]} | "
      f"{'yes' if r['local_baseline'] else 'no'} | `{sig}` |")
A("")
A("## 6. Gap against the local baseline")
A("")
A(f"* The local audit holds 132 server roots; {local_overlap} candidate **repo names** match one of them "
  "by name (repo name ≠ server directory name, so this is a floor, not a join).")
A(f"* **{sum(1 for r in owned_conf if not r['local_baseline'])} of {len(owned_conf)} owned confirmed MCP repos** have no name match in the local "
  "baseline. Treat as an upper bound on the phase-3 gap: one repo can host several servers, and "
  "monorepo-hosted local roots (e.g. `councilof-ai-monorepo`) share a single repo name.")
A("* The migration plan's ~239-server figure counts *servers*; this census counts *repos*. They are "
  "not interchangeable and neither should be added to the other.")
A("")
A("## 7. Known false-positive calls (both flagged, both forks)")
A("")
A("Two records read as `2026-07` and neither is wire evidence:")
A("")
for r in flagged:
    A(f"* **`{r['repo']}`** — evidence: `{'`, `'.join(r['evidence'])}`. " + (
        "README links the 2026-07-28 spec release-candidate blog post (prose date, not a pin)."
        if r["evidence_kind"] == "docs" else
        "validator source parses the proofof.ai ownership token `mcp-name: …`, it does not emit the header."))
A("")
A("A systematic false positive was found and removed during this run: every CSOAI README carries")
A("proofof.ai's **ownership token** `mcp-name: io.github.CSOAI-ORG/<repo>` (as an HTML comment *or* plain")
A("text). It matched the `mcp-name-header` signal and originally inflated `2026-07` to **116** records.")
A("`registry/internal/validators/registries/mcpname.go` documents the token, which is how it was")
A("confirmed as non-wire. Both forms are now stripped before signal extraction, together with HTML")
A("comments. Without that fix the census would have claimed ~118 repos are already on the new wire.")
A("")
A("Related: `gspc-harness` contains two `2026-07-28` date strings in task comments, but no MCP core")
A("signal at all, so it is recorded `not-mcp` (era decided only after corroboration), never `2026-07`.")
A("")
A("Caveats carried forward, not smoothed over:")
A("")
A("* The candidate filter can miss a server whose repo name/description never says MCP (238 repos skipped).")
A("* Shallow records rest on README + guessed paths; a shallow `unknown` is weaker than a deep `unknown`.")
A("* `unknown` is the honest majority answer, exactly as in the local audit: unpinned SDK dependency.")
A("* Era evidence comes from ≤4 files per deep repo (depth-capped), not from executing anything.")
A("")
A("## 8. Rate-limit usage")
A("")
A(f"* `gh api` invocations across this lane: **≈{API_GH_API_GETS}** (≈{API_HTTP} HTTP GETs incl. paginated list "
  "calls), against the 400-call self-imposed cap. 330 of them were the deep-pass tree listings across "
  "two full runs (the first run's raw fetch failed on a local TLS issue and had to be re-run); trees "
  "were then disk-cached so later re-classifications cost 0 calls.")
A("* `gh api rate_limit` reported core `5000/5000 remaining` at every probe — GitHub's counter for this "
  "token never moved, so the numbers above are counted in-process, not read from the API.")
A("* 0 secondary-rate-limit hits; one 30 s backoff hook was armed but never fired.")
A("* All file content came from `raw.githubusercontent.com` (outside API quota), 10 concurrent fetches.")
A("* Write budget: read-only on GitHub — no commits, no PRs, no repo mutations.")
A("")
A("## 9. Artifacts")
A("")
A("| file | contents |")
A("|---|---|")
A(f"| `MCP_WIRE_CENSUS_GITHUB_2026-10-07.jsonl` | {len(recs)} records: `repo, era, signals, migration, checked_at, depth, fork, updated, evidence, files_read, evidence_kind, local_baseline` |")
A("| `MCP_WIRE_CENSUS_REPORT_2026-10-07.md` | this report |")
A("")
A("Driver scripts (scratch dir — Hermes prunes idle scratch files after 24 h, copy them if you want to keep them):")
A("")
A("* `/Users/nicholas/.hermes/cache/scratch/gh_census.py` — listing, tree pass, raw fetch, classify (imports")
A("  `~/clawd/mcp_wire_audit.py`, so the four migration classes and the era vocabulary are identical).")
A("* `/Users/nicholas/.hermes/cache/scratch/gh_census_supplement.py` — second source-file probe for deep")
A("  repos that looked `not-mcp` on README evidence alone.")
A("* `/Users/nicholas/.hermes/cache/scratch/make_report.py` — this document.")
A("")
A("Re-running `gh_census.py` needs no API spend for content: trees and file contents are disk-cached, so it")
A("costs 9 API calls (three repos are permanently empty) and rewrites both artifacts from the same evidence.")

text = "\n".join(L) + "\n"
# fix the two accidentally-split string literals joined above
open(OUT, "w", encoding="utf-8").write(text)
print("wrote", OUT, len(text), "bytes,", len(L), "lines")
