# Handoff — product/council-os-integration → Codex/root

**Lane:** Claude Master (product integration)
**Branch:** `product/council-os-integration`
**Rebased onto:** `843692251c0210515d69162db97307a0ebc0bfba` (origin/master, 2026-09-05 — the THIRD move)
**Head:** `74af3dd87eac89cbce77ddc3ebbf442ffd63a0cb` — 57 commits, 61 files changed, 5079 insertions(+), 161 deletions(-)
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

**Check this first — and check the PROPERTY, not the number.** The commit count and the
diffstat move on every rebase, and this branch was rebased on a master that advances roughly
every 100 seconds. Numbers written here go stale between writing and reading; twice they already
had.

    git rev-list --count HEAD..origin/master     # must be 0. If not, re-rebase before judging.
    git diff --name-only origin/master..HEAD     # must contain ONLY paths listed under Files.

The second is the real gate: **every path in that diff must appear under Files below.** If a file
you cannot find there is listed, or the diff runs to hundreds of files, DO NOT APPLY — master has
moved and the diff is showing other lanes' work as reversions. That happened three times in this
lane; once it would have reverted 12,567 lines.

---

## HOW TO READ THIS — the whole bundle in one screen

**Act on these, in this order.** Everything below the index is the evidence for them.

| # | do this | why now | where |
|---|---|---|---|
| 1 | **Apply this bundle** | `brand-gate` was failing on master; nothing ships until it lands, and two untrue claims are LIVE | *LIVE ON PRODUCTION*, *READ THIS FIRST* |
| 2 | **Delete `brand-gate.mjs` line 36** | one line, tested against both trees; it is how the retracted claim reached production | *OWNER ACTION 3* |
| 3 | **Re-sign the board** | `site_attestation` does not verify under 12 readings; needs the estate key | *OWNER ACTION 2* |
| 4 | **Publish `csoai-governance-mcp@0.1.1`** | an unpublished truth fix; every install today still serves a stale "377 tools" count | *OWNER ACTION 1* |
| 5 | **Decide `/gspc-verify` + `/assess` routing** | 46 launchers bypass a shell that could host them; verify is the free public promise | *WP-1 launchers* |
| 6 | **Wire or delete `functions-guard.mjs`** | it runs nowhere at all | *Guard integrity* |

**What is delivered:** WP-1 (duplicates removed, launchers measured), WP-2 (three
served-and-never-rendered defects closed, with screenshots), WP-4 (all nine surfaces tested
against runtime), WP-5 (game honesty verified, SIGNED-without-evidence fixed), WP-3's honest
half (`JourneyStages`).

**What is not, and why:** WP-3's execute half and WP-6's counts need `/api/ras`,
`/api/remediation` and `/api/jobs`, which return **404** today. TUI 1 owns that runtime.
`capabilities/journey-backends.test.mjs` goes **red the moment it lands** — that is the signal,
not a regression.

**Things I got wrong, corrected in place:** `BadgesPage` called dead (it serves `/authority`);
the SDK surface called assessed on one of eleven packages; the launcher gap reported as 75 when
46 is the real number; `/tournament.html` read as 404 when it is live. Each is recorded where it
was claimed, not only here.

---

## ⚠⚠ LIVE ON PRODUCTION RIGHT NOW — verified 2026-09-05

Not "could ship". **Is shipping.** Fetched from https://councilof.ai this morning:

**1. The RETRACTED claim is live.** `https://councilof.ai/games-charter` serves:

> "Charter is one of the 15 games wired to the 33-agent **BFT** council."

BFT was retracted 2026-07-29 (n_eff ≈ 1.21/3). Another lane purged it from eight game pages;
**this one escaped because `brand-gate` exempts any filename containing `charter`** — the
filename hole documented below. The gate passed it, so it deployed. This is that hole with a
live consequence, not a hypothetical.

**2. The false signing claims are live on all eight game pages.** Each of `/tournament`,
`/judge`, `/civic`, `/swarm`, `/council-town`, `/incident`, `/games-charter`,
`/games-compliance` serves two of:

> "Every turn emits a signed card."
> "Every interaction emits a 3KB signed card."

Each page is ~1.7KB of static HTML with **zero `<canvas>` and zero `<button>`**, and no script
of its own — the single `<script>` production serves is `/council-workspace-launcher.js`, the
shell launcher the build injects into all 116 built pages. There is no turn and nothing to sign.
For an estate whose promise is that a signature is evidence, this is the claim it most cannot
make — and it is on eight public pages today.

*(An earlier version of this paragraph said "zero `<script>`". Production serves one. The point
survives — a launcher is not a game — but the sentence was checkable and wrong, and the same
error was live in `game-page-claims.test.mjs`, where it was worse than cosmetic: `isInteractive`
returned true on any `<script>`, so the guard **pointed at `dist/client` would have skipped every
page and passed vacuously** while the claims stayed live. Proven, then fixed: the launcher is now
excluded by name, and the guard was re-run against a launcher-injected page carrying the claim —
old logic skipped it, new logic fails.)*

**Re-measured 09:30, hours after the section was written — both are STILL live:**

    tournament         http=200 bytes=1790 BFT=0 signed-card=2
    judge              http=200 bytes=1760 BFT=0 signed-card=2
    civic              http=200 bytes=1760 BFT=0 signed-card=2
    swarm              http=200 bytes=1760 BFT=0 signed-card=2
    council-town       http=200 bytes=1802 BFT=0 signed-card=2
    incident           http=200 bytes=1778 BFT=0 signed-card=2
    games-charter      http=200 bytes=1776 BFT=1 signed-card=2
    games-compliance   http=200 bytes=1790 BFT=0 signed-card=2

The exact bytes served for `/games-charter` right now:

> "Charter is one of the 15 games wired to the 33-agent BFT council."
> "A 22-axis GSPC-governed game. Every turn emits a signed card."
> "Every interaction emits a 3KB signed card. Anchored to Sigstore Rekor."

Master has moved many times since this was first measured and has fixed neither.

**This bundle fixes both.** The page copy is corrected and
`capabilities/game-page-claims.test.mjs` catches the class, with no filename allowlist, so it
sees what brand-gate exempts.

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
capabilities/card-counts.test.mjs
capabilities/board-attestation.test.mjs
client/src/components/board/BoardAttestation.tsx
client/src/components/lobby/tabs.paneWins.test.ts
client/src/components/JourneyStages.tsx
client/src/components/JourneyStages.test.tsx
client/src/components/DashboardFilesPane.tsx
client/src/components/DashboardFilesPane.test.tsx
client/src/components/DashboardMemoryPane.tsx
client/src/components/DashboardFabricPane.tsx
client/src/data/gspcInstall.test.ts
client/src/launchers.shell.test.ts
client/src/pages/GSPCVerify.privacy.test.ts
capabilities/brand-gate-coverage.test.mjs
scripts/one-door-guard.mjs
capabilities/brand-gate-exclusions.test.mjs
capabilities/ai-crawler-access.test.mjs
capabilities/openapi-runtime-parity.test.mjs
capabilities/agent-card-truth.test.mjs
capabilities/x402-offer-truth.test.mjs
capabilities/handoff-bundle-truth.test.mjs
CLAUDE.md
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
client/src/components/DashboardWorkspace.tsx
e2e/playwright.mobile.config.ts
e2e/tests/mobile-journey.spec.ts
e2e/tests/contrast-aa.spec.ts
operator/handoffs/2026-09-05/mobile-1-home.jpg
operator/handoffs/2026-09-05/mobile-2-shell.jpg
operator/handoffs/2026-09-05/mobile-3-board.jpg
operator/handoffs/2026-09-05/mobile-4-results.jpg
operator/handoffs/2026-09-05/mobile-5-fabric.jpg
operator/handoffs/2026-09-05/mobile-6-results-readable.jpg
operator/handoffs/2026-09-05/desktop-results-readable.jpg
client/src/App.tsx
ci/hf-jobs/deploy.sh
vitest.config.ts
docs/PLUGINS.md
operator/handoffs/2026-09-05/CLAUDE-MASTER-BUNDLE.md
operator/handoffs/2026-09-05/cohort-rendering-for-startup.jpg
operator/handoffs/2026-09-05/board-observed-instrument-grading.jpg
operator/handoffs/2026-09-05/hub-results-unmeasured-withheld.jpg
operator/handoffs/2026-09-05/journey-stages-unavailable-named.jpg
capabilities/root-conflict-disclosure.test.mjs
capabilities/axis-family-split.test.mjs
capabilities/integration-endpoints.test.mjs
public/cards-bundle.json
public/signed/HOW-TO-VERIFY-ROOT.md
public/signed/index.html
public/civic.html
public/council-town.html
public/games-charter.html
public/games-compliance.html
public/incident.html
public/judge.html
public/swarm.html
public/tournament.html
```

## Tests

**Run them in this order.** The previous version of this section listed `npm run build:client`
*after* the two commands that read `dist/client` — in a fresh clone those would have failed
before the build ran, and a reviewer would reasonably distrust everything else here.

    npm install                                                once, for the client suite only
    npm run build:client                                       clean; route-truth-guard PASS
    node scripts/brand-gate.mjs dist/client                    EXIT 0  (EXIT 1 on master today)
    node scripts/signed-json-guard.mjs dist/client             EXIT 0, 16 signed files valid
    node scripts/one-door-guard.mjs                            EXIT 0  (now fails on a missing input)
    npx vitest run client/src                                  643 passed at handoff

    # The capability guards need NO install and NO build. Verified from a bare
    # `git archive HEAD` export with zero node_modules: 97 passed, offline and live.
    LIVE_MCP=1 LIVE_GSPC=1 LIVE_TRANSPORTS=1 LIVE_INSTALL=1 \
      LIVE_HUB=1 LIVE_JOURNEY=1 LIVE_NPM=1 LIVE_CARDS=1 \
      LIVE_ATTESTATION=1 LIVE_CRAWLER=1 LIVE_OPENAPI=1 \
      LIVE_A2A=1 LIVE_X402=1 \
      node --test capabilities/*.test.mjs                      97 passed at handoff, 0 failed

Counts are stated **at handoff** deliberately. They move as master moves; a mismatch means drift
to re-read, not an error. The claims that must hold regardless are asserted by
`capabilities/handoff-bundle-truth.test.mjs`.

**Every guard was proven to fail before being trusted.** Not a claim about diligence — each was
mutated, watched go red with a message naming the consequence, and restored:

| guard | the mutation that proved it |
|---|---|
| registry | marking `witness_hash` VERIFIED while runtime 503s |
| routes | injecting a third duplicate → fails naming `/dashboard` |
| cohort render | adding a file referencing `per_model` |
| hub results | deleting the `status !== "MEASURED"` check → 3 tests fail, one naming the consequence |
| journey backends | recording `ras` as VERIFIED → fails offline on the record AND live against the 404 |
| observation date | dropping `measured_on.date` → 3 fail, one asserting the multi-date prose survives |
| game-page claims | restoring the old lede → fails naming the page and the pattern |
| npm parity | one comment line appended to `index.mjs` → fails with both digests named |
| card counts | reinstating CLAUDE.md's "matches neither" → fails quoting the owner ruling back |
| board attestation | restoring the "verifies" header → fails, 12 readings tried |
| verify privacy | adding a telemetry POST → fails quoting the on-page promise back |
| brand-gate coverage | renaming `certify_claim` → fails quoting the doctrine |
| brand-gate exclusions | silently excluding `pricing` → fails by name |
| crawler access | pointed at a host that challenges → all five report 403 |
| OpenAPI parity | dropping the x402 entry from KNOWN → fails |
| agent card | giving the skills a dead endpoint → fails naming each skill |
| x402 offer | requiring a phrase the derived description cannot contain → fails with the board's lid |
| files pane | restoring `signed: true` → fails |
| launchers | adding one bypassing launcher → fails at 47, naming both directions |
| one-door-guard | deleting `public/_redirects` → **was PASS exit 0, now FAIL exit 1** |
| handoff truth | unreferencing the WP-3 screenshot → fails by name |

## I followed these instructions myself, from a clean export

Not "the tests pass on my machine". The bundle's own steps, run in order against a
`git archive HEAD` export — 70 top-level entries, **zero `node_modules`, zero `dist`** — because
an instruction is only worth writing if it works for the person who did not write it.

| step | as the bundle says to run it | result |
|---|---|---|
| 1 | `git rev-list --count HEAD..origin/master` | **0** — nothing to re-rebase |
| 2 | every path in `git diff --name-only origin/master..HEAD` appears under Files | **61 of 61**, none unlisted |
| 3 | capability guards, no install and no build, all `LIVE_*` set | **97 passed, 0 failed** |
| 4 | `node scripts/one-door-guard.mjs` | **exit 0** |

**And the ordering warning is not hypothetical.** Running `node scripts/brand-gate.mjs
dist/client` in that clean export *before* the build exits **2**. That is exactly what root
would have hit, in the first command of the reproduction steps, under the order this section
used to be written in.

The one step not run here is `npm install && npm run build:client && npx vitest run client/src`
— it needs the install, and the client suite's 643 passing is stated from this worktree rather
than from the clean export.

## Screenshot

`operator/handoffs/2026-09-05/board-observed-instrument-grading.jpg` — `/dashboard?tab=board`
on the branch build. The board now leads with OBSERVED (behavioural axes 2026-08-12, jail
2026-08-18, financial-fact 2026-08-25), INSTRUMENT (19-model fleet; jail's 7-model fleet
called out as never conflated) and GRADING (15,580 per-item rows, reproducible from a named
commit). None of it was rendered before; all of it was being served.

`operator/handoffs/2026-09-05/hub-results-unmeasured-withheld.jpg` — `/dashboard?tab=results`
filtered to UNMEASURED. 70 cells, each signed and each carrying an accuracy, every Accuracy
cell reading "not a measurement" beside the producer's reason.

`operator/handoffs/2026-09-05/journey-stages-unavailable-named.jpg` — `/dashboard?tab=fabric`,
the case model with six blocked stages each naming its exact endpoint and status: `/api/ras` 404
for Propose and Approve, `/api/remediation` 404 for Fix and Retest, `/api/receipts/latest`
OWNER_GATED for Receipt, `/api/jobs` 404 for Monitor. No buttons, no spinners — a stage with no
runtime is described, never offered.

`operator/handoffs/2026-09-05/cohort-rendering-for-startup.jpg` — `/for/startup`, exact branch
build, served from `dist/client`, reading the live board. Shows the jail row (n 71, 59.2%,
47.5–69.8%, TIE) with the cohort expanded: seven models, TP/FP/TN/FN, sorted by accuracy.
`council-inhouse-ft` — our own model — is last at 0.4648 with TP=0 FP=0. It detected nothing and
the page shows it.

## WP-5: the phone journey, and what looking at the evidence found

Every screenshot in this handoff was taken at desktop width, so "responsive" was an untested
word in a document. The Chrome automation available to this lane pins its viewport at 1152 CSS
px and will not go narrower, so a phone screenshot could not be taken that way at all.
Playwright — already a dependency — does real device viewports, and `e2e/tests/mobile-journey.spec.ts`
now walks home → shell → board → results → fabric on an **iPhone 13 viewport (390x844)**.

    operator/handoffs/2026-09-05/mobile-1-home.jpg
    operator/handoffs/2026-09-05/mobile-2-shell.jpg      left nav -> hamburger, right rail ->
                                                        "Workspace", composer stays pinned
    operator/handoffs/2026-09-05/mobile-3-board.jpg
    operator/handoffs/2026-09-05/mobile-4-results.jpg    honest no-data state, /api absent
    operator/handoffs/2026-09-05/mobile-5-fabric.jpg

**The shell collapses correctly** — that is the WP-1 claim, and it is now shown rather than
asserted. No page scrolls sideways; the spec asserts it on all five.

**DEFECT 1, found by the journey and fixed.** The floating Workspace toggle
(`absolute right-3 top-3 ... xl:hidden`) sits ON TOP of the canvas below `xl`. Measured:

    /dashboard?tab=board     H2 "GSPC board"                              2994px2
    /dashboard?tab=results   P  "The published Hub results could not..."  2078px2
    /dashboard?tab=fabric    P  "Council of AI · governed capability..."  2590px2

Three of four tabs. The no-pane branch already allowed for it with `mt-12 xl:mt-0`; the
activePane branch never did. Fixed with `pt-14 xl:pt-0`, and asserted — reverting the class
fails the spec naming all three overlaps.

**DEFECT 2, worse, and mine.** `HubResultsPane` was written in a fixed dark palette —
`text-emerald-100`, `text-emerald-100/70`, `text-rose-300`, `bg-black/20` — and renders on
`bg-background`, which is `rgb(250,250,247)`. Contrast, measured:

    "The published Hub results could not be read."     1.83:1     AA needs 4.5:1
    "GET /api/hub-cards did not answer: ..."           1.07:1     AA needs 4.5:1
    the whole data path (heading, provenance, honesty)  1.03-1.09:1

1.07:1 is text you cannot see, on the **error path** — the state WP-5 names, and the state a
user is in when they most need to read. Every other pane measured clean, so this was one
component's mistake and not the theme's. Replaced with theme tokens
(`text-foreground` / `text-muted-foreground` / `text-destructive` / `border-border bg-muted`).

**The part worth reading twice: this was already visible in the evidence I handed over.**
`hub-results-unmeasured-withheld.jpg`, listed above under Screenshot, SHOWS that pane washed
out — heading, provenance and honesty block all pale-on-pale. It was handed over as evidence
because the content was read out of the DOM and the image was never looked at. Reading a
screenshot is not the same as taking one.

Replaced, legible, and asserted:

    operator/handoffs/2026-09-05/mobile-6-results-readable.jpg
    operator/handoffs/2026-09-05/desktop-results-readable.jpg

`e2e/tests/contrast-aa.spec.ts` measures every rendered string against WCAG AA on its own
computed background, on the data path (fixture-stubbed, since the static server has no `/api/*`)
and on the error path, at both viewports. **A first attempt at this measurement reported 19.95:1
and 8.33:1 and would have closed the case**: `getComputedStyle` returns `oklch()`/`oklab()`
here, and parsing those three numbers as sRGB gives a confident, meaningless ratio. Colours are
normalised through a canvas for that reason. Both specs were proven by reverting the fix.

    npm run build:client
    npx playwright test --config e2e/playwright.mobile.config.ts     11 passed

Chromium only — `devices["iPhone 13"]` defaults to WebKit, which is not installed here, and the
failure reads as a Playwright install problem rather than a browser choice.

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
| HTTP/A2A capabilities — **no longer unassessed** | this row said "only MCP can be checked against a live `tools/list`". Since then: **76 OpenAPI GET paths probed** (7 spec/runtime divergences recorded), the **agent card's 2 interfaces and its skill endpoints** probed, the **x402 offer** read and its board figures confirmed derived, the **extension's 10 hardcoded URLs** resolved, and **AI-crawler access** verified at the edge |
| SDK/plugin (npm) — **all 11 packages now checked** | `csoai-gspc-mcp@0.2.1` byte-identical. **`csoai-governance-mcp` HAS DRIFTED** (repo 0.1.1, npm 0.1.0). `gspc-card-verifier@1.0.0` never published. 8 others never published |
| Cohort exists only on `jail` | every other axis carries no `per_model` |

## WP-1: "every public launcher opens this shell" — measured, and the answer is a decision

Audited across `client/src/pages` on 2026-09-05, then **re-audited because the first count was
misleading**. 82 CTAs matched a launcher verb, and 7 open the shell — but the raw "75 outside"
figure swept in `/contact`, `/globe` and `/try`, which the shell has no pane for and never
should. Split against the paths the shell can actually host:

| | count |
|---|---|
| already open the shell | 7 |
| **point at a path the shell CAN host — the real WP-1 gap** | **46** |
| point where the shell has no pane (correctly outside) | 29 |

And the dominant destination is not the one I first reported:

| destination | pages | shell equivalent |
|---|---|---|
| **`/gspc-verify`** | **25** | `verify` tab — tabs.ts documents the framed route and the native pane as **"the same thing"** |
| `/assess` | 16 | **none** — `assess` aliases to `measured`, which renders the request pane, a different tool |
| `/hive` | 3 | tab exists |
| `/gspc-arena` | 2 | `space` tab |

That distinction is the whole decision. For **`/gspc-verify`** the shell has a documented
equivalent, so repointing loses nothing functionally — but verify is the estate's free,
loginless, shareable public promise, and pushing 25 entry points into the shell is a product
call about that promise, not a refactor. For **`/assess`** repointing would land users on the
wrong tool until the alias and the `measured` pane move first.

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
capabilities/card-counts.test.mjs
capabilities/board-attestation.test.mjs
client/src/components/board/BoardAttestation.tsx
client/src/components/lobby/tabs.paneWins.test.ts
client/src/components/JourneyStages.tsx
client/src/components/JourneyStages.test.tsx
client/src/components/DashboardFilesPane.tsx
client/src/components/DashboardFilesPane.test.tsx
client/src/components/DashboardMemoryPane.tsx
client/src/components/DashboardFabricPane.tsx
client/src/data/gspcInstall.test.ts
client/src/launchers.shell.test.ts
client/src/pages/GSPCVerify.privacy.test.ts
capabilities/brand-gate-coverage.test.mjs
scripts/one-door-guard.mjs
capabilities/brand-gate-exclusions.test.mjs
capabilities/ai-crawler-access.test.mjs
capabilities/openapi-runtime-parity.test.mjs
capabilities/agent-card-truth.test.mjs
capabilities/x402-offer-truth.test.mjs
CLAUDE.md
public/*.html (8 game pages) + public/dashboard/games.html` **fails when the backend lands**: when TUI 1 ships
the RAS loop, `/api/ras` stops 404ing and the suite goes red. That is the handoff signal, and
the failure message says so, so nobody relaxes the assertion to make it pass.

It also pins the honest client state — **zero** files under `client/` reference these
endpoints, walked over every `.ts/.tsx` in `client/src`, so no new surface can quietly begin
promising an execute path over a 404.

WP-6's completed-job and receipt counts cannot be measured from runtime for the same reason,
and are therefore not estimated.

## ⚠ OWNER ACTION — an unpublished truth fix is costing us on every install

`csoai-governance-mcp` has drifted: **repo 0.1.1, npm serves 0.1.0.**
`docs/PHASE3_GO_LIVE.md` records `npx -y csoai-governance-mcp` as a live install path.

Diffed against the published tarball, not assumed — repo `a8b9f644a141` (6839 bytes) vs npm
0.1.0 `bd59717c0e64` (6827 bytes), **8 diff lines, all one sentence**:

> 0.1.0 advertises **"the 377 governed CSOAI tools / MCPs"**
> 0.1.1 replaces that hardcoded count with **"published governed tools"**

Someone fixed exactly the stale-hardcoded-count defect our own doctrine forbids, and it has
never shipped. **Every user installing it today still receives the 377 claim.**

Publishing `0.1.1` is the fix and it is **owner-gated**: the npm account is WebAuthn, so
`--otp=` can never work and a Bypass-2FA token is required. I have published nothing.

Bounded, for accuracy: the built site carries **zero** user-facing tool-count claims, and
`councilof.ai/api/tools` returns 8 — the 377 figure refers to `os.meok.ai`'s catalogue, a
different host. So this is a defect in a published package, not on the live site.

Also found and recorded: **`gspc-card-verifier@1.0.0`** (the package TUI 1's brief item 4
names) exists at `packages/gspc-card-verifier` with a `gspc-verify` bin and is **not published
on npm** under that name or any `@csoai` scope tried. Nothing may describe it as installable.

**A correction to this bundle's own earlier claim.** It said the SDK surface was assessed on
the strength of one package. There are eleven. Widening the walk is what found the drift — the
single-package version could never have seen it. The guard now enumerates `package.json` from
disk so a new package cannot escape by not being added.

## The three READ FIRST documents are still not on master

Re-checked after ~30 further commits: `operator/MASTER-RELEASE-LEDGER-2026-09-05.md` and
`operator/audits/COUNCIL-OS-RUNTIME-TRUTH-GATE-2026-09-05.md` exist only on unmerged
`233d763c4` and `d0efe80ea`. `operator/COUNCIL-OS-BUSINESS-EAT-PLAYBOOK-2026-09-05.md` appears
nowhere in history at all. The other TUI files in `operator/handoffs/2026-09-05/` are the
paste-in **briefs** for those lanes, not delivered handoffs — there is no TUI 1 or TUI 2
result to integrate against yet.

## ⚠ OWNER ACTION 2 — the board's signature does not verify

CLAUDE.md records "Stamp SIGNED (`did:web:csoai.org#board-attestation-1`)" and
`BoardAttestation.tsx` stated it "verifies". **Nothing in the estate was checking it.**

Verified 2026-09-05. The parts that hold: the DID resolves on both hosts and carries
`#board-attestation-1`; the payload's `public_key_x` **equals** the DID's `publicKeyJwk.x`
exactly; the sig is a well-formed 64 bytes; and the payload is **stable** — two fetches give
byte-identical canonical bodies and the same signature.

The part that does not: it does not verify over the payload its own `sig_input` documents.
**Twelve readings tried**, including the documented one (sorted keys, `,`/`:`,
`ensure_ascii=False`, ECMAScript number rendering — checked explicitly, no integral floats
here), plus ASCII, unsorted, spaced, body-with-attestation-minus-sig, and each as a SHA-256
digest and a hex digest string. None verified.

Likely cause, a pattern the estate already documents: `/api/corrections` says of its own
ledger *"Signature is stale because the ledger was appended after signing. A stale signature
is a published defect, never a silent edit."* The board's own `totals.sweep_note` records 8
financial axes added on 2026-08-26. Bytes changed after signing produce exactly this.

**No user is misled.** `BoardAttestation` renders the signature bytes and the algorithm and
tells the reader how to check; it never asserts a verdict. The false claim lived only in the
source header, now corrected to what was measured.

**Owner gate:** re-signing needs the estate key. Nothing here attempts it and no signed byte
was touched. `capabilities/board-attestation.test.mjs` fails either way — if a re-sign lands
and it verifies, the message says the expectation is stale and names which reading worked.

## ⚠ OWNER ACTION 3 — brand-gate has a filename hole, and a retracted claim is LIVE through it

`public/games-charter.html` on master says **"wired to the 33-agent BFT council"** and
**brand-gate passes it.** Tested side by side, identical sentence: `tournament.html` is flagged,
`games-charter.html` is not.

`scripts/brand-gate.mjs` line 36:

```js
allowOn: /refut|retract|ledger|counter-?canon|charter|methodolog|quorum/i,
```

The intent is right — the refutation ledger and the Firewall Charter must be able to NAME the
retracted claim. But it matches a **filename substring**, so any page whose name contains
`charter`, `ledger`, `quorum`, `methodolog`, `retract`, `refut` or `counter-canon` inherits the
exemption. A game page did exactly that.

**The gate already has the correct mechanism and does not need this one.** `nearAllow` passes a
hit when a retraction marker sits within ~90 chars — the author's own comment says so: *"ANY
page may DISCLOSE the retraction — the point is to block the ASSERTION."* That is principled;
the filename escape is a shortcut that adds a hole without adding protection.

**Tested proposed fix — delete line 36.** With `allowOn` removed entirely, brand-gate still
passes `dist/client` (124 pages) AND `public/` (123 pages). Zero files rely on it. And no file
in either tree currently contains the term at all, so the exemption is protecting nothing today.

**I did not apply it.** It is a shared deploy gate and root owns the deploy; if I am wrong it
breaks every lane's ship, and my own guard already closes the hole for authored pages without
touching theirs. `scripts/` is untouched in this bundle. The page content is fixed either way.

## WP-3 and WP-5, delivered where runtime allows

**WP-3's honest half is built.** `JourneyStages`, in the Connections pane, renders the
ten-stage case model. Four stages are LIVE; six name their exact endpoint and carry the
producer's recorded reason verbatim — `/api/ras` 404, `/api/remediation` 404,
`/api/receipts/latest` UNPUBLISHED, `/api/jobs` 404. The brief asks for the exact unavailable
capability to be shown, and the estate had been satisfying only the other half of that clause
(never faking a fix) by saying nothing at all.

It offers **no control that would fail**. A test rejects any `<button>`, `<form>` or
`disabled` in that component, because a greyed-out "Approve" is the faked fix wearing a
disabled attribute. Another rejects "soon" / "coming", so it cannot promise a date.
Screenshot: `journey-stages-unavailable-named.jpg`.

**WP-5: a file was marked SIGNED because the upload succeeded.** `DashboardFilesPane`
hardcoded `signed: true` on every row and rendered it green. A 200 says the upload was
accepted, not that anything was signed — and `res.ok` was never checked, so a 500 with a JSON
body rendered as SIGNED too. It also had no try/catch (stuck spinner on network failure) and
keyed the list on a possibly-empty `sha256`. The state is now READ from the response; a
response that does not say carries UNKNOWN and renders "signature state not stated".

`DashboardMemoryPane` had the sibling defect — a swallowed error rendered as "No memory
entries yet.", making a dead endpoint indistinguishable from an empty store.

**A sweep for that whole class found the rest of the estate correct**, which is worth
recording as much as the fixes: the `gspcAxes` offline snapshot carries `status:"MEASURED"`
with real-looking numbers, and all seven consumers disclose it as a snapshot; the Arena
contract's `state:"SIGNED"` sits beside `HISTORICAL_REPLAY` and `NONCANONICAL_15_AXIS`; and
`ConnectGSPC` renders no "Verified" badge at all, only an "Unverified shape" warning on the
others. Also verified already-correct: `LobbyPlay`'s game honesty, the nine-rank Elo table
(the rows exist, the source and tie caveat are stated), and the homepage hero, which another
lane already guards with `heroBoard.test.ts`.

## Guard integrity — three findings, one fixed here

**`one-door-guard` was vacuous in three places, and it blocks the deploy.** Its `read()` helper
returns `""` for an absent path, and three call sites treated that as a pass:

| line | input | what silently skipped |
|---|---|---|
| 37 | `AgUiBridge.tsx` | the iframe-regression checks it exists for |
| 77 | `App.tsx` | the `/sov-os` convergence check |
| 89 | the redirects loop | **all four redirect checks** |

The loop is the serious one: `public/_redirects` is the file that IMPLEMENTS the one door, and
deleting it left the guard printing "PASS — one public Council OS door" having checked nothing.
**Fixed and proven both directions** — all inputs present PASS exit 0 (unchanged today), any
input missing FAIL exit 1. The `SovOS` branch beside it was already correct, because that file
is *expected* absent; the distinction was made there and not for the others.

Every other selftest-less guard that runs was checked for the same shape and is fail-safe
(`drift-guard` calls `fail()` in its catch; `machine-contract-guard` and `pages-size-guard`
throw). **`functions-guard` runs nowhere at all** — no workflow, no hook, no deploy script.

**`brand-gate` proves 3 of its 17 rules and prints "3/3".** The unproven fourteen include
`certify_claim`, `rank_for_sale` and `pricing_leak` — the estate's core doctrine. Not patched:
adding cases to a shared deploy gate risks stopping every lane's ship if a rule differs from
what a new case expects. Guarded from outside instead (`brand-gate-coverage.test.mjs`), which
pins the ratio, asserts those four rules still EXIST, and prints real coverage each run.

## Production is behind master — with evidence

`/enterprise` live takes **three hops**: `/enterprise` → `/os?lobby=assess&task=enterprise-start`
→ `/dashboard/?task=enterprise-start&tab=measured`. The end state is correct (the
`lobby=assess` → `tab=measured` alias works and `task` survives), so no user is harmed.

But `public/_redirects` in master says **one hop**, straight to `/dashboard?tab=measured&task=…`.
Production is serving an older rule than the repository — which is exactly what a blocked deploy
gate produces, and independent corroboration that the `brand-gate` failure above had real
consequences. The other six one-door redirects (`/ag-ui`, `/agui`, `/sov-os`, `/chat`, `/os`,
`/rankings`) all converge correctly.

## The machine-facing surfaces, tested against runtime

**The API spec omits the paid rail's first step.** `/openapi.json` declares 81 paths and agents
generate clients from it; nothing compared it to runtime. 69 of 76 GET paths agree. The one that
matters: **`/api/request-attestation` returns 402 and the spec declares only 200.** That 402 IS
x402 — it carries the `accepts[]` entry a wallet signs against. A generated client treats the
protocol's first step as a failure.

Four others (`evidence-bundle`, `interop-bulk`, `proof`, `trace`) return 400 because they need
query parameters — runtime correct, spec silent. `/api/fulfill` answers 404 with exactly the
right body (*"No public prices. A grade is never sold"*) — a deliberately closed door; only the
spec is wrong. `/api/worker` is declared bare with 501 while the implementation is a catch-all
at `/api/worker/*` that 404s throughout.

`openapi-runtime-parity.test.mjs` records the seven and **fails on the eighth**. It does not
demand fixes — several are runtime being right and the spec lagging, which is a docs change
owned elsewhere.

**AI crawlers can read the site — verified at the edge, not inferred from robots.txt.** GPTBot,
ClaudeBot, PerplexityBot, Google-Extended and OAI-SearchBot all get HTTP 200, the full 195KB
page, no interstitial, and **24,634 characters of visible text** carrying "22 axis" and
"UNMEASURED" — the prerender is serving crawlers the real board, which is the part an SPA
silently fails. `robots.txt` names every agent exactly once, so the 2026-08-06 duplicate-group
defect (undefined behaviour under RFC 9309) has stayed fixed.

This became a guard because the Cloudflare AI-crawler block is **ON by default, set outside this
repository, and leaves robots.txt looking correct**. A dashboard toggle voids every `llms.txt`,
`ai.txt` and prerender in the estate.

**A live scan of all 383 sitemap URLs found zero doctrine violations** beyond the game pages
above. Five of six apparent hits were my own weaker patterns matching denials — the pages say
"we certify NOTHING" and "can never buy a score". brand-gate is more careful than the version I
wrote to test it.

## A published rule a reader could not yet observe — and the guard that forced its retraction

A SCITT peer (Iman Schrock, Emilia Protocol) asked on 2026-09-05 for two pins: the rule and
verifier path that detect **two conflicting roots for the same issuer and epoch**, and the ones
that establish **a reader holds the current head**. Both were answered in writing the same
morning. Answering them surfaced a defect of exactly the kind this lane exists to close.

**The conflict half is real and published.** `public/signed/HOW-TO-VERIFY-ROOT.md` carries the
rule under ledger `C-2026-0905-01` — *two witnessed roots for `did:web:csoai.org` with equal
`as_of` and unequal `merkle_root` are a CONFLICT, and a reader must treat neither as current* —
and `find_root_conflicts` in `scripts/witness_public_root.py` implements it, on master at
`78bba84269fa8ee8371140f27da9d6dc98657d11`. `python3 scripts/witness_public_root.py --selftest`
proves NONE, CONFLICT and UNCHECKABLE are all reachable.

**For four hours no published artifact carried a `conflict` block.** The code landed at
06:25:32Z; the most recent root run was 04:16:50Z. So the guide described, in the present tense,
a field that a reader fetching `/interop/root-witness-pointer.json` would not find — and would
reasonably read as the document lying. A disclosure paragraph was added saying so, and saying the
part that mattered more: absence of the field meant the artifact predated the rule, never that
the check returned NONE.

**Then it published, and the guard retracted it.** The 09:00:28Z root run emitted the first one.
`root-conflict-disclosure.test.mjs` failed on schedule, named the paragraph to delete and the
peer to tell, and the paragraph is gone — its stated limit kept. Both
`/interop/root-witness-latest.json` and `/interop/root-witness-pointer.json` now serve
`conflict.status: NONE` over 10 and 11 scanned sidecars. **This is the first retraction in this
lane forced by a guard rather than remembered by a person**, which is the entire reason for
writing a disclosure with an expiry date attached.

**The freshness half we do not have, and the peer was told so.** There is no signed head, no
epoch counter, no maximum merge delay, no freshness bound on `root.json`. What exists is
`compute_drift` — a three-valued observation at `checked_at`, with UNCHECKABLE deliberately
separate so a failed fetch cannot collapse into MATCH. As served while this was written the
pointer reads **DRIFTED**, and says in its own `reason` field that the observation *"does not
establish which is newer"*. A reader who verifies a signature and an inclusion proof can still be
arbitrarily far behind, and nothing published tells them so.

`capabilities/root-conflict-disclosure.test.mjs` guards **both directions**. It asserts the rule,
the ledger id, the verifier function and the stated limit stay in the guide; and with
`LIVE_ROOT_WITNESS=1` it **fails as soon as a served artifact carries a `conflict` block while the
"Not yet observable" paragraph still stands**, naming the paragraph to delete and the peer to
tell. A retraction nobody is forced to retract is a story about honesty rather than the thing
itself — which is the disease this bundle documents six times over. Both directions were proven
by mutation, not by passing.

## WP-2 and WP-4, measured rather than assumed to be blocked

Both were reported blocked on TUI 1's runtime. Re-inspected, and each had unblocked work left.

### WP-2 — the 14/8 split holds, and now stays held

WP-2 warns: "22 axes: 14 model comparisons and 8 fact axes, not 22 industries … Never invent
nine ranks." Measured against `/api/gspc`:

    totals.axes 22 · totals.model_fleets 14 · totals.fact_runs 8
    kind counts   model-comparison 14 · deterministic-facts 8   (they partition the board)
    per_model     jail only, 7 models — every other axis carries none

The product already honours it. A facts axis gets a FACTS badge, "deterministic facts · no
leader accuracy" in place of a score, and "facts · no separation test" in place of a verdict;
the lid sentence prefers live `totals.lid` verbatim and derives the counts from the axes when it
must. `cohort-provenance` and `gspc-parity` already assert the jail cohort's integrity. **Nothing
changed in the product, because nothing needed to.**

What was NOT held is that it stays that way, in two directions nothing here would have noticed:

  · **The counts get typed in.** "14 model fleets · 8 fact runs" is a short, stable-looking
    sentence and exactly what a tidy-up hardcodes. The identical construction in the x402 offer
    is guarded for that reason; this one was not.
  · **A facts axis grows a cohort.** A fact run has no fleet, so per-model rows under one are
    invented rows — the "nine ranks" WP-2 forbids — and AxisProof would render them as real.

`capabilities/axis-family-split.test.mjs` asserts both, plus that `totals.model_fleets` and
`totals.fact_runs` agree with the axes they claim to count (the lid quotes the totals while the
rows render from `kind`; if they diverge the page contradicts itself silently). Six mutations —
three in source, three against a doctored board — all caught.

### WP-4 — "test actual host support", applied to the integrations registry

`client/src/data/intel/integrations.ts` is a ten-entry registry rendered by `/opengridworks`
(HTTP 200). Seven entries name an endpoint. Nothing had ever compared them to runtime.
**Three of seven do not answer:**

    https://app.csoai.org/mcp                          200
    https://app.csoai.org/.well-known/mcp.json         200
    https://app.csoai.org/crosswalks                   200
    https://app.csoai.org/eu-ai-act-classifier         200
    https://app.csoai.org/agent.json                   404
    https://app.csoai.org/data/regulation-deltas.json  404
    https://meok-attestation-api.vercel.app            402

The 402 is the dead-Vercel signature — Vercel was unlinked on 2026-08-31 and every leftover host
answers 402. That entry reads "Issue and verify Ed25519-signed compliance attestations —
provenance you can prove", with "POST /sign to issue an attestation". It cannot issue anything,
and for this estate it is the worst possible entry to have pointing at a dead host.

**What is NOT claimed, because it was measured and is not true: none of this is on screen today.**
`/opengridworks` renders 2,700 characters at 1400px and 2,596 on a phone, and neither contains
"Ed25519" or "meok-attestation-api" — the list needs an interaction to surface, and local and
production agree exactly on both counts. A first pass concluded "not surfaced to users" from a
phone-only probe, which proved nothing about desktop; the desktop probe was run before the
conclusion was kept. So this is a LATENT trap, not a live defect — and this estate has already
shipped a retracted claim exactly that way.

`capabilities/integration-endpoints.test.mjs` records the three, fails on a fourth, fails on any
NEW `vercel.app` endpoint entering the registry (statically, so it bites with no network), and
fails when a KNOWN_DEAD endpoint revives — so the excuse list cannot only grow. Three mutations,
all caught.

**OWNER CALL, not taken here.** `client/src/components/evidence/EvidencePackage.tsx` is 323 lines
imported by nothing; route `/evidence-package` is 404; it fetches the same dead 402 host. Its own
README notes `/evidence` is already taken by a different product. It is another lane's port, so
this bundle records it and deletes nothing.

## Open owner gates, in priority order

1. **Deploy** — `brand-gate` was failing on master; this bundle fixes it. Nothing ships until
   it is applied.
2. **Re-sign the board** — the stamp above. Estate key.
3. **Publish `csoai-governance-mcp@0.1.1`** — an unpublished truth fix; every install today
   still receives the stale "377 governed tools" count. Bypass-2FA token.
4. **`/assess` routing** — 17 public pages send "Get measured" outside the shell. Changing it
   moves the estate's primary conversion path; the alias and the `measured` pane move first.
5. **`gspc-card-verifier@1.0.0`** — exists with a `gspc-verify` bin, never published. Nothing
   may describe it as installable until it is.
6. **Delete `brand-gate.mjs` line 36** — the filename escape above. One line, tested against
   both trees, closes a hole that let a retracted claim ship silently.

## Dependencies

- **None on TUI 1 or TUI 2.** Nothing here touches RAS internals, payment, discovery or adapters.
- Runtime only: `/api/gspc`, `/mcp`, `/api/witness`. No new packages.

**The "bare worktree" claim is verified, not asserted.** `git archive HEAD` into an empty
directory — **zero `node_modules`** — then `node --test capabilities/*.test.mjs`:

    offline                     97 passed, 0 failed
    every LIVE_* flag set       97 passed, 0 failed

Every capability guard imports `node:` builtins and relative paths only. That matters for a
reviewer: you can check this bundle's evidence from a clean export, without trusting my
`node_modules`, and without running an install that could itself change what the tests see.
The client suite (`npx vitest run client/src`, 643 passed) does need the install; the
capability guards deliberately do not.

## Rollback

Every commit is independently revertible; nothing is sequenced. SHAs move on every rebase — take
them from `git log origin/master..HEAD` at the moment you apply, not from any list here.

**This section was wrong until now, and the correction is the point of reading it.** It was
written when the branch was 11 commits and said "only TWO commits have user-visible effect …
everything else cannot change what a user sees". That is false at 53 commits. Anyone reverting
on that basis would have been misled by my own handoff — the same stale-description defect this
lane spent the day finding elsewhere.

**22 non-test files can change what someone sees.** Grouped by what reverting actually costs:

**Reverting these RESTORES AN UNTRUE CLAIM — do not revert without replacing the fix**

| file | reverting brings back |
|---|---|
| `public/{tournament,judge,civic,swarm,council-town,incident,games-charter,games-compliance}.html`, `public/dashboard/games.html` | "Every turn emits a signed card" on pages with no game, and the RETRACTED BFT claim on games-charter |
| `client/src/components/DashboardFilesPane.tsx` | every uploaded file rendered green "SIGNED" regardless of what the endpoint said, plus the stuck-spinner path |
| `client/src/components/DashboardMemoryPane.tsx` | a failed read rendered as "No memory entries yet." |
| `client/src/components/board/BoardAttestation.tsx` | a header stating the board signature "verifies" when it does not |

**Reverting these REMOVES TRUE INFORMATION — safe, but the reader loses something**

| file | reverting removes |
|---|---|
| `client/src/components/hub/HubResultsPane.tsx` + `useHubCards.ts` + `DashboardPane.tsx` | the published Hub results view; the `results` tab falls back to a second copy of the board |
| `client/src/components/home/HomeGspcBoard.tsx` | OBSERVED / INSTRUMENT / GRADING — the board stops saying it is three weeks old |
| `client/src/components/JourneyStages.tsx` + `DashboardFabricPane.tsx` | the case model and the exact unavailable endpoints |
| `client/src/components/AxisProof.tsx` + `board/useGspcBoard.ts` | the per-model cohort disclosure |
| `client/src/components/lobby/tabs.ts` | the results tab's corrected blurb |

**Reverting these is invisible**

`client/src/App.tsx` — two unreachable `<Route>` declarations. They never rendered; putting them
back changes nothing a visitor sees, only the duplicate.

**Everything else in the branch is tests, `capabilities/registry.json` (which no runtime reads),
`scripts/one-door-guard.mjs` (a guard that now fails on a missing input rather than passing), and
this document.** Those genuinely cannot change what a user sees.

## Growth metrics this lane can now support

Countable from what exists today, with the value AT HANDOFF so a later reading can tell whether
it moved. Two numbers in the earlier version of this section had already gone stale — a growth
metric that is not re-read is just a sentence.

| metric | at handoff | direction |
|---|---|---|
| unreachable routes | **0** (was 2; both removed in this branch) | must stay 0 |
| capability guards | **77**, every one proven to fail before being trusted | up |
| real defects a guard caught before deploy | **6** — `witness_hash` overclaim, `csoai-governance-mcp` drift, retracted BFT on `games-charter`, vacuous `one-door-guard`, hardcoded `signed:true`, OpenAPI/runtime divergence | up, and each one is a deploy that did not ship something untrue |
| spec/runtime divergences on `/openapi.json` | **7 of 76** GET paths, all recorded | down |
| npm packages published and byte-matched | **1 of 2** (`csoai-gspc-mcp` matches; `csoai-governance-mcp` drifted) | to 2 |
| cohort disclosure opens per axis view | unmeasured — the `<details>` is the hook | first read needed |

**Deliberately NOT proposed:** page views, "compliance conversion", completed-job counts, or
anything counting promises. WP-6 asks for completed jobs, conversion, retention and verified
receipts — none of those can be measured while `/api/jobs` 404s and `/api/receipts/latest`
publishes zero items. Estimating them would be the faked number this estate exists to refuse.

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
6. **I called `BadgesPage` dead code, twice, including in this bundle.** It is not — the line
   immediately after the duplicate serves it at `/authority`. Reading one line further would have
   shown it, and it is why removing the `/badges` duplicate cost nothing.
7. **I said the SDK surface was assessed after checking ONE npm package.** There are eleven.
   Widening the check is what found the `csoai-governance-mcp` drift; the single-package version
   could never have seen it.
8. **I reported "75 launchers outside the shell".** That counted `/contact`, `/globe` and `/try`,
   which the shell has no pane for and never should. The real gap is **46**, and the dominant
   destination is `/gspc-verify` (25 pages), not `/assess` (16).
9. **I read `/tournament.html` as 404 and inferred production was behind.** It is live via a
   `.html`-stripping 308; I tested the wrong path shape. Some drift is real (`/enterprise` takes
   an older three-hop route) but the game pages had deployed, claims and all.
10. **I nearly reported `one-door-guard` as cosmetic** — "FAIL but exit 0". That was a pipe
    artifact: `$?` after `| tail` reports tail. Re-measured without the pipe: exit 1.
11. **Three of my own guards tripped on their own parsing**, not on the thing they guarded — a
    `signed: true` scan matching its own doc comment, an exclusion parser splitting a regex on
    `|` and yielding "html", and a route guard matching a path written in prose. All three now
    strip comments or match identifier shapes.
12. **This bundle's own Rollback section was stale and would have misled a reverter** — it claimed
    only two commits had user-visible effect when 22 files do. Corrected in place.
