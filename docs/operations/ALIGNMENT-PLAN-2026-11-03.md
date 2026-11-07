# Alignment scan and today's plan — 2026-11-03

*Written from bytes: the live production surfaces, the repository, and every host. Every number
below was read, not typed. Where something is a finding rather than a fact, it says so.*

## 1. What is live right now

| surface | state |
|---|---|
| Board (`GET /api/gspc`) | **34 axes · 34 measured** — every axis is measured |
| `claim-maintenance` | MEASURED, kind `measured-subject`, n 174 (the option-3 promotion, live) |
| `watchdog-ingest` | MEASURED, kind `measured-subject`, **n 106** sources probed |
| End-user journeys (13 checked) | all 200: `/`, `/axes`, `/gspc-verify/`, `/report`, `/constitutional-harness/`, `/dashboard/`, `/api/gspc`, `/api/root`, `/api/state`, `/.well-known/x402.json`, `/.well-known/constitutional-harness.json`, `/interop/ots/manifest.json`, `/interop/gspc-fact-table/MANIFEST.json` |
| Watchdog intake | daily, 18 sources pinned, 18 probed, 18 reachable, 12 grid hits |
| x402 index | 31 resources |
| OTS manifest | 682 proofs, with the SBOM's new proof live |
| Fact table | published (20,517 measurement rows, 807 items, 677 cells) |

## 2. What was blocking everything else — FOUND and FIXED

**The deploy had been failing on master for days**, so nothing merged after it reached production.
The failures were **not** in the app: two e2e assertions in `e2e/tests/dashboard-shell.spec.ts`
were pointing at a UI the estate deliberately changed.

1. *"GSPC quests … never promote play into measurement"* asserted the play pane says
   "currently admitted ranking". The pane's copy now says it *"grades you in-browser and keeps
   historical board references separate from current admitted evidence"*. The assertion was
   reading a string the app no longer renders.
2. *"the home header carries a booking door to /assess/ within one click"* asserted a header
   door **on the homepage** — but `Header.tsx` renders that door only when `!homepage`, and
   `HomepageChrome.test.tsx` pins the homepage dropping it, because the homepage carries its own
   door inside the board panel. The test then fell through to clicking the **mobile** menu button
   in a desktop viewport and timed out.

Both are now stated as the contract the code actually implements, and the substantive
requirements are unchanged: play is never promoted into measurement, and the /assess route stays
one click away. **4 e2e tests pass locally (both assertions × desktop and mobile).**

**The build's Hub reads were anonymous, and the Hub rate-limits anonymous reads per IP.** A 429
from our *own published banks* broke the build, and therefore the deploy, for reasons that had
nothing to do with the code being built. `build-bench-suite.mjs` and `build-lm-eval-tasks.mjs` now
send the token when one is present — the correct credential for the org's own datasets, and a far
higher limit.

## 3. What is still missing, and the order it goes in

### P0 — the deploy (this branch). Nothing else reaches production until it lands.
Two stale e2e assertions, fixed, and the build's Hub reads made authenticated. **Next: merge, and
confirm the deploy goes green and production catches up to master.**

### P1 — the psychogenicity axis is the last un-registered instrument
The instrument is on master (bank, builder, runner, two arms, boundary rule). What is missing is
the **publication**: `csoai/gspc-psychogenicity` returns **401 on the Hub** — the dataset does not
exist — so the axis cannot be registered, because the board's pin must be of the **published**
bytes, not the repo's.
- The dataset card is written (`/tmp/hf-stage/README.md`); the bytes hash to `ecfb5563…`, matching
  the bank's own pin.
- The publish needs a live HF token. The M2 holds one at `~/.secrets/hf_token` (org `csoai`,
  role write). The M4's `HF_TOKEN` returns **401** — dead.
- Then: publish, read the published bytes back, take the published digest, and add the axis
  (`public/bench/axes.json`, the board's axis source, the axis agent card, the lm-eval export,
  and the per-item rows so it joins the fact table).

### P2 — the venue ruling is still unbuilt in the live estate
The owner's ruling was: the daily assurance report is published **as our Constitutional Harness
Charter artefact**, for SAFE/LFX/ISAB to adopt or mirror.
- Live charter is still **v0.1.0** with **one** amendment entry.
- The daily signal index is **not** on master (`public/.well-known/daily-signal-index.json` → 404).
- The pieces are written and were not merged: `scripts/measurements/build-daily-signal-index.mjs`
  (the consolidation of axes, card corpus, fact table and watchdog corpus, with the gaps
  published) and `scripts/charter/publish-charter-v0.2.mjs` (a new charter version that names
  the index and **appends** an amendment entry; the 2026-09-28 signed release snapshot is never
  edited).
- Next: land both, publish charter v0.2.0, and route the index to the human gate
  (`HOLD`, approval may not be inferred).

### P3 — align the watchdog work instead of shipping a second instrument
Another lane already built `scripts/watchdog_intake.py` (18 pinned sources, per-source shape
specs, 7 unpinned findings recorded rather than hidden) and froze the daily runs, so
`watchdog-ingest` is **already MEASURED with n 106**. My own corpus (`harness/watchdogs/`, 13
sources) is therefore **superseded** and must **not** ship as a parallel instrument. What survives
from it is one idea worth folding in: the corpus as the **declared denominator** — every source we
have heard of, with the field we would count — so "which of them do we actually read" is a
published gap rather than an absence.

### P4 — the hosts, so the M4 stops being the machine that does the work
- **M4 (Mac)**: 20 GiB free. The desktop and `desktop-commander` live here
  (`~/.local/bin/desktop-commander`, `~/.dsh/mcp/desktopcommander_connect.py`, with a live OAuth
  token for `https://mcp.desktopcommander.app`). The 2.6 GB estate clone was trashed; the working
  clone is `/tmp/estate-m4` (throwaway) and should become a durable one.
- **M2 (Linux)**: the durable build/run host, **5.2 GB free** — too tight for a clone plus
  `node_modules`. It holds the only live HF token.
- **RunPod**: paid, and **transient** — the estate-scratch pod was recycled and no longer exists.
  Good for burst compute (the MEOK arm over the 237-item bank), not for a durable clone.
- **Hugging Face**: the artefact store (public datasets + private storage). Banks, per-item row
  corpora and evidence packs belong there, not on a laptop.

### P5 — the standing owner decisions
- **CI concurrency**: 7 of the 9 workflows a PR triggers have no per-branch
  `cancel-in-progress`. Adding the block `pr-gates.yml` already uses would cut the backlog ~82 %.
  It is also the same root cause as the merge race: master takes merges faster than a CI cycle,
  so GitHub recomputes the synthetic merge ref before the checks land on it.
- **Keys**: the npm token is dead (401) for the card-verifier publish, and no PayAI credential
  exists for the 5 stale Bazaar listings.
- **The claim-maintenance disclosure split** is decided (option 3) and shipped.
- **MEOK routing**: once MEOK tops the frozen benchmarks, it routes less. That is measurable on
  the board — every arm's per-item rows are already published — so the routing question is a
  question about the measurement, not about the intent.

## 4. The invariant this plan keeps

**Frozen is published; fluid is derived.** A frozen benchmark is a pinned, sha-addressed bank
whose digest is a claim. Everything that moves is a derived surface over those bytes: the daily
index, the axes pages, the llms views, the fact table. A derived surface never carries a typed
number — it reads the board, and the board reads the bytes. That is why "the board says 34 axes"
and "the page says 34 axes" cannot drift: there is only one derivation, and the gates compare
values rather than phrases.
