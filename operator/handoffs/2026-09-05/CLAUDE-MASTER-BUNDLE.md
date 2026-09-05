# Handoff — product/council-os-integration → Codex/root

**Lane:** Claude Master (product integration)
**Branch:** `product/council-os-integration`
**Rebased onto:** `d0d6767ad3f925acf23d5c469ea82e549f50dd48` (origin/master, 2026-09-05)
**Head:** see `git log` below — 5 commits, 8 files, +774/−102
**Status:** NOT integrated, NOT pushed to master, NOT deployed. Root owns all of that.

The branch was originally cut from `464b17cd2`. master gained a commit while this ran, and
`git diff origin/master..HEAD` was showing another lane's `free-door.*` and `finish-the-rail.sh`
as reversions. Rebased before packaging, so the diff below is only this lane's work. **If you see
those files in the bundle, do not apply it — re-rebase first.**

## Exact commits

**Head:** `6fae5360e25dab328f7f7dd6fc0b2d475a2c167b`

| SHA | change |
|---|---|
| `45b3c65ef` | capabilities: the registry can now say "declared and deliberately gated" |
| `0595526ec` | routes: fail on duplicate paths — two pages are currently unreachable |
| `854e8ed2a` | gspc: one board, two transports — no contradiction, but each drops half of WP-2 |
| `996faa06a` | gspc: the per-model cohort is served and the product never shows it |
| `8fc01b6d6` | AxisProof: show the cohort behind the number |
| `0709b7af2` | handoff: the reviewed bundle for root, and what I got wrong |
| `f4b95101c` | tools: docs said HTTP carried the same seven — it serves eleven |
| `922cd27e1` | capabilities: AG-UI, A2A and A2UI now carry the state their endpoint actually returns |
| `68032672e` | install: the surfaces are honest, and the probe that said otherwise was wrong |
| `6fae5360e` | AxisProof: name the cohort table for screen readers |

## Files

    capabilities/registry.json                   +availability states on 12 MCP capabilities
    capabilities/registry.test.mjs               NEW  fails closed on registry/runtime drift
    capabilities/gspc-parity.test.mjs            NEW  HTTP vs MCP field agreement
    capabilities/cohort-provenance.test.mjs      NEW  per-model data integrity
    client/src/routes.duplicate.test.ts          NEW  duplicate React route guard
    client/src/components/AxisProof.tsx          +cohort disclosure
    client/src/components/AxisProof.test.tsx     NEW  5 tests incl. the all-zero row
    client/src/components/board/useGspcBoard.ts  +PerModelRow type, +per_model/quotable_models

## Tests

    npx vitest run client/src                                  110 files, 595 passed
    npm run build:client                                       clean; route-truth-guard PASS
    LIVE_MCP=1 LIVE_GSPC=1 LIVE_TRANSPORTS=1 LIVE_INSTALL=1 \
      node --test capabilities/*.test.mjs                      25 passed, 0 failed

Every guard was proven to fail before being trusted:

- registry — marking `witness_hash` VERIFIED while runtime 503s → "declared, not served, not gated"
- routes — injecting a third duplicate → fails naming `/dashboard`
- cohort render — adding a file referencing `per_model` → fails naming the file
- parity — both recorded gap lists were WRONG on first run and the live test corrected them

## Screenshot

`operator/handoffs/2026-09-05/cohort-rendering-for-startup.jpg` — `/for/startup`, exact branch
build, served from `dist/client`, reading the live board. Shows the jail row (n 71, 59.2%,
47.5–69.8%, TIE) with the cohort expanded: seven models, TP/FP/TN/FN, sorted by accuracy.
`council-inhouse-ft` — our own model — is last at 0.4648 with TP=0 FP=0. It detected nothing and
the page shows it.

## Capability gaps (measured, not assumed)

| gap | evidence |
|---|---|
| AG-UI general provider wire | `/api/agui/wire` 503 `agui_wire_unconfigured` — needs `AGUI_WIRE_URL` |
| A2A task runtime | `/api/a2a/key` and `/api/a2a` both 404 — the card is discovery only |
| A2UI renderer | `/api/a2ui` 404 — no round trip, nothing offered |
| Web app install prompt | manifest served and linked on every route; **no browser prompt observed**, so LOCAL_CANDIDATE, not installable |
| Chrome extension | no `key` field → load-unpacked; hosts limited to councilof.ai + huggingface.co |
| MCP drops **ties** and **cohort** | `get_axis` has no `separation`, `per_model`, `quotable_models` |
| HTTP drops **observation date** at axis level | present at response top level; absent per axis |
| `witness_hash` declared, not served | `/api/witness` 503 `QUARANTINED_PRE_RELEASE` — deliberate |
| Other 72 HTTP/A2A capabilities UNASSESSED | only MCP can be checked against a live `tools/list` |
| Cohort exists only on `jail` | every other axis carries no `per_model` |

## Owner decisions (2) — blocking nothing, but both hide a page

1. **`/badges`** — line 709 redirects to `/badge`; line 1061 declares `BadgesPage`. First wins, so
   `BadgesPage` is dead. It is also the newest file (2 Sep). Serve it, or delete it?
2. **`/challenge`** — `Challenge` (150 lines) wins; `ChallengeDoor` (88 lines) is dead. Which?

Both are listed as `KNOWN_DUPLICATES` in `routes.duplicate.test.ts`, and a third test asserts they
are STILL duplicated — so the exception list cannot rot into permanent permission.

## Dependencies

- **None on TUI 1 or TUI 2.** Nothing here touches RAS internals, payment, discovery or adapters.
- Runtime only: `/api/gspc`, `/mcp`, `/api/witness`. No new packages. `node:test` was used for the
  capability guards so they run in a bare worktree with no install.

## Rollback

Every commit is independently revertible; nothing is sequenced.

    git revert 1da8fb2fc     # UI only — removes the cohort disclosure, board unchanged
    git revert ab7a1ce9e c5216709c 5b3b6c8e2   # tests only — no runtime effect
    git revert 09862f32d     # restores the registry to counts.by_protocol.mcp = 12

The only commit with user-visible effect is `1da8fb2fc`. It adds a collapsed `<details>` below one
row of one component; reverting it changes nothing else. The four others are tests and a data file
that no runtime reads.

## Growth metrics this lane can now support

Not proposed — these are countable from what exists today:

- **cohort disclosure opens per axis view** — the first measure of whether readers want evidence
  or just the headline. Currently unmeasured; the `<details>` is the hook.
- **capability drift incidents caught before deploy** — registry test failures per week. Baseline 1
  (`witness_hash`, found on the first run).
- **unreachable routes** — currently 2. A number that should only go down.
- **transports answering all six WP-2 requirements** — currently 0 of 2.

Deliberately NOT proposed: page views, "compliance conversion", or anything counting promises.

## What I got wrong, recorded so root does not inherit it as fact

1. **I collapsed `/os` believing it was a second shell. It was not.** `OsRoute` was already a
   redirect to `/dashboard` that preserves the query string and maps `lobby` → `tab`. My
   replacement hardcoded `defaultTab="fabric"` and discarded the query. **Reverted.** An existing
   test (`OsShell.test.ts`) caught it. WP-1 as briefed has no target — there is no second shell.
2. **I claimed `?axis=` drops `measured_on`.** It does not. My probe read the axis entry rather
   than the response. ApiDocs is accurate.
3. **I expected the UI to conflate SIGNED with verified.** It does not — `BoardAttestation` renders
   `verification_state || "UNVERIFIABLE"`, `osChat` falls back to `"UNSTATED"`.
4. **I nearly reported a manifest-link defect on `/dashboard` and `/gspc-verify`.** They return
   308 to their trailing-slash form; a probe that does not follow redirects reads an empty body
   and counts zero. `curl -sL` finds the link. The routes were fine; the measurement was not.
   `install-truth.test.mjs` now asserts a non-empty body BEFORE asserting the tag.
5. **The three `operator/` docs the goal names are not in `origin/master`.** They exist only on
   unmerged commits `d0efe80ea` and `233d763c4`. Read from there. The handoff's canonical snapshot
   `2bf948504` is stale by several commits.
