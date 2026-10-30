# Daily consolidation — 30 October 2026

**What this record is.** One page that answers the four questions the owner asked on the
morning of 30 October 2026, using what was actually verified today, and naming what is
still open. It supersedes nothing; it is the index for this day's work.

**Date of pass:** 2026-10-30 · **Host:** Apple M4 · `/Users/nicholas`
**Estate:** `~/src/councilof-ai` · branch `feature/watchdog-intake-signal-index-20261030`

---

## 1. The hardware identity, settled

The owner asked to consolidate "all ChatGPT on browser" and M2 work. The M2/M4 identity
was ambiguous in earlier documents and **is now resolved by direct hardware command**, so
the rest of this record is stated against the right machine:

| Host | Verified role | Working tree state |
| --- | --- | --- |
| **Apple M2** · `/Users/iokfarm` | Active backend `~/meok-him`; specialist/router work `~/workspace_for_ai/meok-router` | Both trees carry **uncommitted changes** — a Git HEAD alone is not the running source |
| **Apple M4** · `/Users/nicholas` | Studio `~/_alignment/axis-runs-20261024/`; port 8786 bridges to the M2 backend on 8787 | `~/meok-him` here is a **plugin, not the full backend** |

Earlier documents reversed these identities. Do not relocate work or swap source ownership
on the old labels. This correction resolved a **live defect**: the `council-staff` MCP
registration on this machine pointed at `/Users/iokfarm/workspace_for_ai/meok-router/…`,
a path that does not exist here, so the registration succeeded and yielded **no tools at
all**. It now points at the estate's own server and serves all seven.

## 2. What was asked, and the honest answer to each

The owner asked: *are we measuring all the public watchdogs and incident databases?*

**No — and now they are.** The audit, before any change:

- The **AI Incident Database** was carried as a **one-shot presence probe** —
  `public/.well-known/layer-o-presence.json` → `ns_incidentdatabase_ai`, state QUALIFIED,
  presence UNMEASURED, `as_of 2026-09-29`. That is a record that a URL answered *once, on
  a day, forever*. It is not a measurement and was never one.
- **NVD, CVE, OSV and GHSA had no entries at all.** A repo-wide grep for
  `services.nvd.nist.gov`, `api.osv.dev` and `api.github.com/advisories` found exactly one
  caller, inside `scripts/badger/`, and nothing that ran on a schedule.
- The surface named "public watchdog" (`functions/_lib/watchdogRoute.ts`) is a
  **verifier router for the estate's own artefacts** — it checks signed cards and Merkle
  proofs. It does not ingest anyone's watchdog.

So the truthful answer was: **nothing was measured, one thing was probed once.**

## 3. What was built today

### 3.1 A daily intake harness — `scripts/watchdog_intake.py`

Eighteen public sources, each pinned to a URL that **was probed live on 30 October 2026
and answered**. A pinned URL that quietly 404s is a silent zero, and a silent zero inside
a coverage measurement is a lie — so the registry only carries sources that answered.

Each source is graded into one of three states that are **never merged**:

| State | Meaning |
| --- | --- |
| `REACHABLE` | answered 200 with the shape its publisher documents |
| `UNCHECKABLE` | answered 200 with a body that is **not** the documented shape |
| `UNREACHABLE` | did not answer |

`n` counts **sources probed** — the same grammar as effect-binding's "tool-call servers
probed" — and is never pooled with bank-item `n`.

**Result of the first real run (2026-10-30T05:10:40Z):** 18 sources probed · 18
REACHABLE · 0 UNCHECKABLE · 0 UNREACHABLE. Real counts observed: CISA KEV 1,764 known
exploited CVEs · NVD 416,948 · Rekor transparency log 3,463,510,023 entries · MITRE ATLAS
221 techniques · 38 releases · Go vuln DB 1,443 modules · OpenRouter 456 models.

### 3.2 The gap stays visible — 7 unpinned findings

Sources that were probed and **did not qualify** are recorded, not dropped:

- **AI Incident Database — NO PUBLIC MACHINE-READABLE API.** The site is a Gatsby SPA;
  `/api/incidents` is not a route and returns 404 with HTML. The corpus lives in a private
  database, published as a static Excel export. **There is no URL a daily run can poll.**
  This is a gap in the *source*, not in our reader.
- **CERT-EU and Eclipse advisories** serve HTML only — no documented machine-readable feed.
  Counting HTML byte length as an advisory count would be inventing a number.
- **npm bulk advisories** require POST (405 on GET).
- **ATLAS `dist/ATLAS.yaml`** answers but **self-declares deprecated**; the harness resolves
  the current release from `dist/manifest.yaml` instead.
- **`api.sigstore.dev`** did not resolve from this host — a DNS failure at one machine is
  not proof the source is gone, so it is recorded as unproven, not as absent.

### 3.3 A daily signal index and a WG-SAFE charter feed

`public/interop/watchdog-intake/_index.json` is the consolidated daily view: one row per
source, derived from the latest run.

`scripts/watchdog_charter_feed.py` turns that index into the **human routing queue** — 43
rows across 18 sources, one per (source × obligation) pair where the source's axis grid
intersects the obligation's axis grid. Relevance is a **mechanical intersection**, so it
cannot drift from the data.

Each row states what the source said, binds it by digest, names the question for the
human, and carries `human_decision: HOLD`, `may_apply: false`, `challenge_opened: false`.
**No challenge is opened automatically** — a challenge carries a decision id, an authority
epoch, a scope digest and an expiry, and opening one from a script would put a machine in
the seat the HOLD gate reserves for a person.

The obligations tracked are the estate's own: `article-50`, `article-53`, `charter`,
`dora`, `cra`.

### 3.4 The 34th axis — `watchdog-ingest`

The board moves **33 → 34 axes · 23 measured · 11 unmeasured**, and it moves there
**derived, never typed**: the count is computed from the axis array at serve time.

It is a **declared slot, `family: subject`, `kind: declared-slot`, `n: 0`,
`status: UNMEASURED`** — because a daily probe of 18 sources is not a frozen n≥30 bank.
`n: 0` is the literal truth, never a score. It becomes MEASURED when the daily runs are
frozen, sha-pinned and pinned to a published run window.

It is wired end to end: axis module → specialist registry (34 specialists, 34 closed
HOLD gates, 0 applied) → board snapshot → alias table → MCP tool `axis_watchdog-ingest`
→ capability registry → fleet lock → agent card → the rendered distribution surface. Its
audit reads `MEASUREMENT_GAP_VISIBLE` with **0 findings**.

### 3.5 The count grammar — the blocker that was fixed first

`canon.json` froze `axes_total 23 / measured_axes 23 / unmeasured_axes 0` while the board
had legitimately grown to 33/23/10 on 16 October. Consequences:

- `drift-guard` was **red on a correct live board** — it compared live totals for
  *equality* against a frozen number.
- Its self-heal re-triggered `deploy.yml` **every 30 minutes**, roughly **30 needless
  deploys a day for ~50 days**, to fix a number that **no deploy can change**.
- A gate red on a correct answer gets set to `continue-on-error` within a week, and then
  protects nothing — the same end state as a gate that cannot go red at all.

The counts are now **floors plus a grammar**, the rule `scripts/board-production-anchor.mjs`
had already enforced at PR time ("only the count of unmeasured axes may grow"):

- slots may not shrink below the floor; **growth is published, not drift**
- measured axes may not shrink below the floor; **a measurement disappearing is drift**
- `unmeasured_axes` must equal `axes − measured_axes`, read from the payload
- `public_count` must agree with the numbers beside it

`drift-guard` is **green against the live site for the first time**, and a **10-case
selftest** proves it can still go red on shrinkage, on a lost measurement, on a gap count
that stops deriving, and on public copy that freezes while the data moves.

## 4. The three defects found and repaired

1. **`council-staff` MCP pointed at another user's home** (`/Users/iokfarm/…`, which does
   not exist on this machine). The registration succeeded and served **nothing**. Now
   pointed at the estate's own server; verified to start and serve exactly seven tools
   (`list_staff`, `ask_staff`, `oversight_state`, `oversight_modules`,
   `answer_competency_module`, `raise_challenge`, `record_decision`).
2. **The count grammar** (§3.5) — a gate red on a correct board, plus a 30-deploys-a-day
   self-heal loop.
3. **`scripts/pod-loops/drift-draft.py` read the canon fields the rename removed.** All
   five resolved to `None` silently and reported a phantom drift. Fixed to read the floors
   by their real names, with an explicit `uncheckable` note when a floor is absent.

## 5. Verification — what was run, and what it means

| Check | Result |
| --- | --- |
| `scripts/drift-guard.mjs --selftest` | 10 cases, 6 must-fail — **OK** |
| `scripts/drift-guard.mjs --host https://councilof.ai` | **PASS** (green for the first time) |
| `scripts/test_watchdog_intake.py` | 14 tests — **OK** |
| `scripts/test_watchdog_charter_feed.py` | 15 tests — **OK** |
| `npx vitest run functions/api/` | **2,305 passed**, 11 skipped |
| `npx vitest run client/` | **2,654 passed** |
| `npx vitest run functions/mcp/` | **273 passed**, 1 skipped |
| `node scripts/axis-specialists.mjs --selftest` | 34 specialists, 11 unmeasured-promotion controls — **OK** |
| `node scripts/capability-render.mjs all --check` | 5 artifacts match — **OK** |
| `python3 scripts/build_openapi.py --check` | 180 paths — **matches its producer** |
| `node scripts/mcp-probe.mjs --check` | honest — **OK** |
| `node scripts/facts-gate.mjs --selftest` | 68 passed, 0 failed — **OK** |
| `node scripts/build-axis-reports.mjs` | 34 slots · 211 reports · **0 UNMAPPED** |

The harness is **proven able to fail**: the tests pin that a dead host reads
`UNREACHABLE` and never `0`, that HTML where a feed is documented reads `UNCHECKABLE` and
never a zero count, and that the three states are never summed into a figure that would
read like a score.

## 6. The parallel lane, and why it does not conflict

A second lane is active at `~/_alignment/watchdog-working-groups-20261030`
(branch `codex/watchdog-working-groups-20261030`, last commit 05:28Z). It owns the
**human** side: a working-group charter, the group registry, the reviewer/recruitment
model, and the review UI.

This work owns the **machine** side: the intake, the signal index, the axis, and the
routing queue that hands work to humans.

The two are complementary, and the lane is **not on `origin/master`** — `working-groups.json`
and `workingGroups.ts` exist only lane-locally, so there is no file conflict. Its charter
already states the same division: *"automated specialists propose; people decide."*
**Do not merge either lane into the other without the owner.**

## 7. What is NOT established — carried forward honestly

From the retained research pack, **not re-verified in this pass**:

- **No enrolled production human approver.** The 03:35:33Z consolidated readback reports
  **zero configured human operator keys**, human execution **not joined**, provider
  dispatch **disabled**, constitutional maximum **not joined**.
- **No positive authorised production effect.** No bounded-stop claim is supported.
- **33 declared specialists; 66 specified controls not run.**
- **No production browser acceptance, and no keyboard-only or real-human acceptance.**
  Reported test totals must not be summed into a marketing total — suites overlap in
  purpose and differ in scope.
- The M2 working trees carry **uncommitted changes**; a Git HEAD alone is not the running
  source. The M4 `councilof-ai-ops` and `councilof-ai-publish` trees are also dirty.

**This work does not change any of those.** The 34th axis is a **declared slot**, not a
claim that the human path is staffed.

## 8. The next four moves, in order

1. **Land this branch as a PR** (base `master`), with the rendered artifacts in the same
   commit. Deploy stays gated: `deploy.yml` on push to master, never direct wrangler
   (`DEPLOY-LOCK.md`).
2. **Re-run the probe after the deploy** — `node scripts/mcp-probe.mjs` **without**
   `--door-origin` — and commit the live observation, replacing the pre-deploy stand-in
   record. The committed artifact currently says so on every row it touched, which is the
   point.
3. **Wire the daily job.** The workflow does not exist yet. The house style is in
   `.github/workflows/catalog-trust-round.yml` (schedule + `workflow_dispatch`, run the
   script, land via PR, never push master). Note: signing via `/api/board-sign` requires
   the workflow filename to contain `public-root`, `hf-fin-shells`, `hf-inference-mill` or
   `auto-eat-sign` — the intake artifact is **unsigned** until a lane is chosen for it.
4. **Open the AIID data request** — ask the maintainers for a public incident JSON/CSV
   export path, or ingest their published Excel export on a slower cadence. Until then
   `aiid` stays a **published gap**, not a covered source.

**Also still open, and not touched here:** the `.github/workflows/eat-overnight.yml`
board assertion is **stale from before this work** (it checks for `"22 axis"`, and the
live board reads `33 axes · 23 measured`), so that scheduled job has been failing on its
own terms. It needs a separate fix and is not caused by the 34th axis.

---

### Provenance

`canon.json` · `scripts/drift-guard.mjs` · `scripts/watchdog_intake.py` ·
`scripts/test_watchdog_intake.py` · `scripts/watchdog_charter_feed.py` ·
`scripts/test_watchdog_charter_feed.py` · `functions/api/_gspc_axes_d.ts` ·
`council-os/axis-specialists/registry.json` ·
`council-os/axis-specialists/board-2026-10-28.snapshot.json` ·
`public/interop/watchdog-intake/` ·
`docs/standards/osaia-safe-reverification/SAFE-v1.0-PORT-20261026.md` ·
`docs/governance/public-watchdog-working-groups.md` (lane-local) ·
`~/Downloads/Council_of_AI_Completion_Intelligence_Addendum_v1_1_2026-10-30.docx`

*Measurement, never certification. Nothing here certifies a system, a vendor, a person
or an obligation, and nothing here approves an action. Every human gate in this chain
is HOLD.*
