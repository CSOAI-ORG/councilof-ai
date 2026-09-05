# Handoff — product/council-os-integration → Codex/root

**Lane:** Claude Master (product integration)
**Branch:** `product/council-os-integration`
**Rebased onto:** `cd56fed9fc976eecf4fdd124680bc7f8e76f4c4b` (origin/master, 2026-09-05 — the THIRD move)
**Head:** `428786963f61ab58b0eb9f4258327bbaec7d9c3f` — 25 commits, 39 files changed
**Status:** NOT integrated, NOT pushed to master, NOT deployed. Root owns all of that.

**RE-REBASE BEFORE APPLYING.** master moved THREE times during this lane. Each time
`git diff origin/master..HEAD` began showing other lanes' work as REVERSIONS — the second time
573 files and 12,567 deletions, and the third time 972 files and 42,620 deletions — which
would have wiped `free-door`, the public-root adapters, the research alignment, the nine game
pages, the XRPL settlement work and the ChatGPT/dashboard feature set had anyone applied it.
Rebased again before packaging; verified again after.

**MASTER MOVES EVERY ~100 SECONDS.** Measured over the last 40 commits: median gap 100s
(1.7 min), minimum 0s. During this lane's final rebase master advanced again mid-rebase —
`45d6c3dd6` is 17 seconds newer than the `c47a1e54f` I started the rebase against, and the
rebase landed on the newer tip. So the diff in this bundle is guaranteed to be stale by the
time you read it. Re-rebasing is not a precaution here, it is the only way to get a diff
that means anything. Verify with `git rev-list --count HEAD..origin/master` — it must be 0
before you judge the diffstat.

Check this first: `git diff --stat origin/master..HEAD` must show ~39 files and only the paths
listed under Files. If it shows hundreds, or any file this bundle does not name, DO NOT APPLY —
re-rebase.

## ⚠ READ THIS FIRST — master could not ship, and this bundle fixes it

`node scripts/brand-gate.mjs dist/client` — **step 3 of the four-step deploy pipeline in
CLAUDE.md** — was **exiting 1 on master**. Eight game pages carried the word **BFT**, which
brand-gate itself records as **RETRACTED 2026-07-29**: *"Byzantine/BFT/fault-tolerant asserts
the withdrawn claim (n_eff about 1.21/3)"*. Every lane's deploy was blocked, not only that
content. The gate names its own replacement, so the fix was dictated, not invented.

The same pages also claimed capabilities they do not have:

> "Every turn emits a signed card."
> "Every interaction emits a 3KB signed card. Anchored to OTS + Sigstore Rekor + EAS on Base."

Each page is ~1.7KB of static HTML with **zero `<script>`, zero `<canvas>`, zero `<button>`**.
There is no turn and nothing to sign. They also contradicted our own `LobbyPlay`, which states
that nothing in the gallery is a measurement and nothing in it is signed.

**After this bundle:** brand-gate EXIT 0 (124 pages), signed-json-guard EXIT 0.

Another lane authored those pages. Only the untrue sentences and the deploy-blocking word were
changed; the pages, routes and structure are theirs and are untouched. If that lane wants
different wording, it is theirs to set — but it cannot go back to `BFT` without stopping the
estate shipping again.

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
| `6e8f15103` | handoff: master moved twice — re-rebase before applying |
| `50f1fdf52` | gspc: the published Hub results were served and never rendered |
| `072fec07c` | handoff: master moves every ~100s — re-rebase is mandatory |
| `4ac1fb8ee` | capabilities: the journey's missing backends, measured rather than assumed |
| (see `git log`) | gspc: the board never said when it was measured, or with what |

## Files

```
capabilities/cohort-provenance.test.mjs
capabilities/hub-results.test.mjs
capabilities/journey-backends.test.mjs
capabilities/game-page-claims.test.mjs
capabilities/npm-package-parity.test.mjs
public/*.html (8 game pages) + public/dashboard/games.html
capabilities/gspc-parity.test.mjs
capabilities/install-truth.test.mjs
capabilities/registry.json
capabilities/registry.test.mjs
capabilities/tool-catalogue-parity.test.mjs
capabilities/transport-availability.test.mjs
client/src/components/AxisProof.test.tsx
client/src/components/hub/HubResultsPane.tsx
client/src/components/hub/HubResultsPane.test.tsx
client/src/components/hub/useHubCards.ts
client/src/components/home/HomeGspcBoard.tsx
client/src/components/home/HomeGspcBoard.measuredOn.test.tsx
client/src/components/DashboardPane.tsx
client/src/components/DashboardLayout.test.ts
client/src/components/lobby/tabs.ts
client/src/components/AxisProof.tsx
client/src/components/board/useGspcBoard.ts
client/src/routes.duplicate.test.ts
client/src/App.tsx
docs/PLUGINS.md
operator/handoffs/2026-09-05/CLAUDE-MASTER-BUNDLE.md
operator/handoffs/2026-09-05/cohort-rendering-for-startup.jpg
```

## Tests

    npx vitest run client/src                                  112 files, 614 passed
    node scripts/brand-gate.mjs dist/client                    EXIT 0 (was EXIT 1 on master)
    node scripts/signed-json-guard.mjs dist/client             EXIT 0, 16 signed files valid
    npm run build:client                                       clean; route-truth-guard PASS
    LIVE_MCP=1 LIVE_GSPC=1 LIVE_TRANSPORTS=1 LIVE_INSTALL=1 \
      LIVE_HUB=1 LIVE_JOURNEY=1 \
      LIVE_NPM=1 node --test capabilities/*.test.mjs           41 passed, 0 failed

Every guard was proven to fail before being trusted:

- registry — marking `witness_hash` VERIFIED while runtime 503s → "declared, not served, not gated"
- routes — injecting a third duplicate → fails naming `/dashboard`
- cohort render — adding a file referencing `per_model` → fails naming the file
- parity — both recorded gap lists were WRONG on first run and the live test corrected them
- hub results — deleting the `status !== "MEASURED"` check in `displayAccuracy` fails three
  tests, one naming the consequence: an UNMEASURED cell's number rendered as a result
- journey backends — recording `ras` as VERIFIED fails two tests, one offline on the record
  and one live against the 404, each naming the consequence
- observation date — dropping `measured_on.date` from the board fails three tests, one
  asserting the multi-date prose survives rather than being flattened to one timestamp
- game-page claims — restoring the old lede fails, naming the page and the pattern. brand-gate
  catches a banned WORD; this catches a true-sounding SENTENCE that happens to be false
- npm parity — appending one comment line to `index.mjs` fails it with both digests named

## Screenshot

`operator/handoffs/2026-09-05/board-observed-instrument-grading.jpg` — `/dashboard?tab=board`
on the branch build. The board now leads with OBSERVED (behavioural axes 2026-08-12, jail
2026-08-18, financial-fact 2026-08-25), INSTRUMENT (19-model fleet; jail's 7-model fleet
called out as never conflated) and GRADING (15,580 per-item rows, reproducible from a named
commit). None of it was rendered before; all of it was being served.

`operator/handoffs/2026-09-05/hub-results-unmeasured-withheld.jpg` — `/dashboard?tab=results`
filtered to UNMEASURED. 70 cells, each signed and each carrying an accuracy, every Accuracy
cell reading "not a measurement" beside the producer's reason.

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
| SDK/plugin (npm) — **now assessed, and clean** | `csoai-gspc-mcp@0.2.1` published; tarball **byte-identical** to `mcp/gspc-server` on all four behaviour files. Guarded, because publishing needs the owner's Bypass-2FA token, so drift is the default failure |
| Cohort exists only on `jail` | every other axis carries no `per_model` |

## WP-1: "every public launcher opens this shell" — measured, and the answer is a decision

Audited across `client/src/pages` on 2026-09-05: **82 public job-launchers. 7 point at
`/dashboard`. 75 do not.** The single most common destination is `/assess` — **seventeen**
public pages send "Get measured" there (OnboardOS, MarketingHome, WhyCSOAI, HowItWorks,
SystemCard, EUAIActGuide, ISO42001Guide, NISTAIRMFGuide, TC260Guide, ConformityAssessment,
ReadinessAssessment, EuActClassifier, GlobalRegulationTracker, HorusIntel, AccountBrief,
AiGovernanceHub, Dashboard).

**The blocker is not the links.** Two things in the shell already decide this:

1. `PANES.measured` is `DashboardRequestPane` (the x402 request pane), and `DashboardPane`
   resolves `PANES[id]` before `tab.path` — so the `measured` tab's declared `path: "/assess"`
   is never framed.
2. `normalizeLobbyTabId` maps **`assess` → `measured`**. So `?tab=assess` cannot reach
   `AssessTool` even if a pane existed for it.

Together those are a decision someone already made: **in the shell, "get measured" means the
Requests pane, not the screening tool.** Standalone `/assess` means the screening tool.

I tried adding an `assess` pane and reverted it — the alias made it unreachable, so it would
have shipped as dead code. My own test caught that.

**The open question, which is genuinely the owner's:** should the 17 "Get measured" CTAs keep
going to the standalone screening tool, or should the shell be the destination? Repointing
them changes the estate's primary conversion path on every public page. If the answer is the
shell, the alias and the `measured` pane both have to move first, and `AssessTool` needs a
real in-shell home.

Worth knowing before deciding: `/api/assess` is **live and executable** — a POST returns a
real screening (`result_id`, `input_digest`, `screening_state`), verified against production
2026-09-05. It is the executable half of the case model, not a guide.

## WP-1: both duplicate routes resolved

`/badges` and `/challenge` were each declared twice in App.tsx. wouter matches the first
`<Route>`, so the second component could never render. Both second declarations are deleted.
**Nothing a visitor sees changes** — an unreachable route renders for nobody.

| path | kept | removed |
|---|---|---|
| `/badges` | line 709, `Redirect -> /badge` (already won) | line 1061, `BadgesPage` |
| `/challenge` | line 674, `Challenge` (already won) | line 711, `ChallengeDoor` |

**A correction to what this bundle previously said.** It recorded `BadgesPage` as dead code.
It is not — the line immediately after the duplicate serves it at `/authority`, which is
exactly why removing the `/badges` duplicate cost nothing. A test now asserts `/authority`
still serves it, so the page cannot vanish quietly if that route is ever touched.

`ChallengeDoor` genuinely had no other route; its lazy import is removed so the bundle stops
shipping an unreachable chunk, and the file stays on disk. `Challenge` (150 lines, live)
already covers the same redress ground.

`KNOWN_DUPLICATES` is now empty and a new test asserts there are no duplicate routes at all.

**Still genuinely the owner's call, and now a smaller question:** whether `/badges` should
serve `BadgesPage` rather than redirect, and whether the `ChallengeDoor` redress form should
be wired anywhere. Both are questions about ADDING a page, not about an invisible collision.

## WP-3 and WP-6: the gap, now measured rather than asserted

Re-probed 2026-09-05, unauthenticated, against production:

| endpoint | result | state |
|---|---|---|
| `/api/findings` | 200, CSOAI fleet with schema + honesty + as_of | VERIFIED |
| `/api/ras`, `/api/ras/status` | 404 `not_found` | UNAVAILABLE |
| `/api/remediation` | 404 `not_found` | UNAVAILABLE |
| `/api/jobs` | 404 `not_found` | UNAVAILABLE |
| `/api/receipts/latest` | 200, `UNPUBLISHED`, items `[]`, count 0 | OWNER_GATED |

The case model reaches **ask → scope → inspect → explain** and stops. Everything from
`propose` onward has no runtime, so approve/fix/retest/receipt is not built — that would be
the faked completed fix WP-3 forbids.

`capabilities/journey-backends.test.mjs
capabilities/game-page-claims.test.mjs
capabilities/npm-package-parity.test.mjs
public/*.html (8 game pages) + public/dashboard/games.html` **fails when the backend lands**: when TUI 1 ships
the RAS loop, `/api/ras` stops 404ing and the suite goes red. That is the handoff signal, and
the failure message says so, so nobody relaxes the assertion to make it pass.

It also pins the honest client state — **zero** files under `client/` reference these
endpoints, walked over every `.ts/.tsx` in `client/src`, so no new surface can quietly begin
promising an execute path over a 404.

WP-6's completed-job and receipt counts cannot be measured from runtime for the same reason,
and are therefore not estimated.

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
