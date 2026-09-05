# Handoff — product/council-os-integration → Codex/root

**Lane:** Claude Master (product integration)
**Branch:** `product/council-os-integration`
**Rebased onto:** `3bbfccb033e9db35061c9f7d2027478e230ff3ea` (origin/master, 2026-09-05)
**Head:** `f2b7e167f98f123a2701d9b466aac249255ba7cf` — 11 commits, 14 files changed, 1259 insertions(+), 103 deletions(-)
**Status:** NOT integrated, NOT pushed to master, NOT deployed. Root owns all of that.

**RE-REBASE BEFORE APPLYING.** master moved twice during this lane. Both times
`git diff origin/master..HEAD` began showing other lanes' work as REVERSIONS — the second time
573 files and 12,567 deletions, which would have wiped `free-door`, the public-root adapters and
the research alignment had anyone applied it. Rebased again before packaging.

Check this first: `git diff --stat origin/master..HEAD` must show ~14 files and only the paths
listed under Files. If it shows hundreds, or any file this bundle does not name, DO NOT APPLY —
re-rebase.

## Exact commits

| SHA | change |
|---|---|
| `fc2d457ec` | capabilities: the registry can now say "declared and deliberately gated" |
| `ff3403989` | routes: fail on duplicate paths — two pages are currently unreachable |
| `820cf292f` | gspc: one board, two transports — no contradiction, but each drops half of WP-2 |
| `c9e21b4c7` | gspc: the per-model cohort is served and the product never shows it |
| `df3cf7ca7` | AxisProof: show the cohort behind the number |
| `f0db67802` | handoff: the reviewed bundle for root, and what I got wrong |
| `8fe3ac859` | tools: docs said HTTP carried the same seven — it serves eleven |
| `3ed6e1968` | capabilities: AG-UI, A2A and A2UI now carry the state their endpoint actually returns |
| `44a3664c0` | install: the surfaces are honest, and the probe that said otherwise was wrong |
| `4935824d3` | AxisProof: name the cohort table for screen readers |
| `f2b7e167f` | handoff: bring the bundle up to the current head |

## Files

```
capabilities/cohort-provenance.test.mjs
capabilities/gspc-parity.test.mjs
capabilities/install-truth.test.mjs
capabilities/registry.json
capabilities/registry.test.mjs
capabilities/tool-catalogue-parity.test.mjs
capabilities/transport-availability.test.mjs
client/src/components/AxisProof.test.tsx
client/src/components/AxisProof.tsx
client/src/components/board/useGspcBoard.ts
client/src/routes.duplicate.test.ts
docs/PLUGINS.md
operator/handoffs/2026-09-05/CLAUDE-MASTER-BUNDLE.md
operator/handoffs/2026-09-05/cohort-rendering-for-startup.jpg
```

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

Every commit is independently revertible; nothing is sequenced. SHAs move on every rebase — take
them from `git log origin/master..HEAD` at the moment you apply, not from this list.

Only TWO commits have user-visible effect, and both touch one component:

- **the cohort disclosure** — adds a collapsed `<details>` under one row of `AxisProof`. Reverting
  removes the cohort table and changes nothing else; the board, the axis row and every other
  component are untouched.
- **the caption** — adds one `sr-only` `<caption>`. No visual effect at all.

Everything else is tests, a data file no runtime reads (`capabilities/registry.json`), and one
documentation correction (`docs/PLUGINS.md`). Reverting any of them cannot change what a user
sees.

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
