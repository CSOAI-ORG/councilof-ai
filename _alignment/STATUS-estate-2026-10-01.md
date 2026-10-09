# STATUS estate — Lane 1 (MIMO v2.6 goal 1) — 2026-10-01T10:46Z

Session `ses_-ffe5f090ad5b0ffexBGks2dmd`. Mandate: one live-state matrix + one highest-impact mismatch resolved in isolation or handed off. No land, no deploy.

## 1. Live-state matrix

| Surface | Owner | Source | Tested state | Public state | Blocker |
|---|---|---|---|---|---|
| Council OS shell | release owner | councilof.ai `/dashboard/` `/board/` | shell HTML 200 (90644b / 137389b); `/os` 308→`/dashboard/` | LIVE | none (trailing-slash 308 is normal) |
| GSPC board | measurement | `/api/gspc` | 23 axes · 23 measured (derived); 0 separated · 7 TIE · 7 UNTESTED | LIVE 200 | DOI UNAVAILABLE (Zenodo account blocked 29 Sep; appeal pending) |
| Live state | estate | `/api/state` | contract + ledgers present; claim_maintenance state PROBED run_at 2026-09-29 | LIVE 200 | register as_of older than checks ledger |
| MCP surface | interop | `/api/mcp` | 200 (61234b) | LIVE | none |
| Site / llms / root | release | `/` `/llms.txt` `/root.json` | 200; root 319 leaves | LIVE | card_index 335 vs root 319 = staged-not-rooted (not claimed as gap without ledger) |
| Plugin (npm) | packaging | registry.npmjs.org/csoai-gspc-mcp | 200, latest 0.2.2 | PUBLISHED | npmjs.com web UI 403 to non-browser UA (known) |
| Claim maintenance | lane 4 | `/api/claims/register` | as_of 2026-09-25; 28 subjects / 99 claims | LIVE but STALE vs wall clock | **26/28 next_scheduled_read in the past still labelled SCHEDULED** ← this lane's fix |
| MEOK local | lane 5 | :3101 :3200 :8077 | no listeners | n/a on M4 right now | SOV3/meok-king not running locally |
| Release branches | release owner | CSOAI-ORG/councilof-ai PRs | 25 open; 6 MERGEABLE non-draft; 12+ CONFLICTING | master `bc83baf76` moving | **GHA account-level disabled (HTTP 422)** — cannot run pr-gates |

## 2. Highest-impact mismatch resolved (isolated, not landed)

**Defect:** `scripts/claim-maintenance-register.mjs` hard-coded `next_scheduled_read_state` to `SCHEDULED` whenever a date existed, even when that date was already before the register's own `as_of`. After the weekly pod loop was retired (2026-09-28) those reads did not run, so the public register advertised 26 healthy scheduled reads that were actually past due. The one scheduler's vocabulary for that state is `DUE_NOT_RUN` (`scripts/claims/maintenance_due.py`).

### Before / after receipt
```
BEFORE live https://councilof.ai/api/claims/register
  as_of 2026-09-25T11:08:49Z
  next_scheduled_read_state: SCHEDULED 26, UNSCHEDULED 2
  totals.subjects_with_a_scheduled_next_read = 26

AFTER local public/spec/claim-maintenance/register.json (regenerated)
  as_of 2026-10-01T10:44:58Z
  next_scheduled_read_state: DUE_NOT_RUN 26, UNSCHEDULED 2
  totals.subjects_with_a_scheduled_next_read = 0
  totals.subjects_with_a_due_unrun_next_read = 26

TEST node scripts/claim-maintenance-register.mjs --check
  [register] OK — 28 subject(s), 99 claim(s), 3 live registry file(s) (4 superseded)

TEST npx vitest run scripts/claim-maintenance-producers.test.mjs
  register test PASSED (committed register matches registries on disk)
  spec test FAILED (pre-existing DRIFT on public/spec/claim-maintenance/index.json vs .md — NOT touched by this change)
```

### Gated handoff (do not land here)
- Branch: `estate/claim-register-due-state-20261001` @ `428ddd8c`
- Path: `/Users/nicholas/clawd/wt-estate-continue-20261001` (origin `CSOAI-ORG/councilof-ai`)
- Files: `scripts/claim-maintenance-register.mjs`, `public/spec/claim-maintenance/register.json`
- Owning lane to land: **lane 4** (claim maintenance) or the **release owner** via normal PR + gates
- Blocked on: GHA account-level disable (HTTP 422) — pr-gates cannot run until https://github.com/settings/billing/summary is cleared
- Pre-existing unrelated red: claim-maintenance-spec.mjs reports index.json DRIFT

## 3. Owner / other-lane gates (this lane does not clear them)
- Nick: re-enable GitHub Actions (billing) — every open PR is gate-starved
- Nick: Zenodo appeal (DOI UNAVAILABLE since 2026-09-29)
- Lane 4: execute the overdue scheduled-reads now that the register will say DUE_NOT_RUN
- Lane 5: MEOK local stack down on M4
- Lane 6: M4 disk 2.9Gi free / 81%

## 4. Finish line
ONE reproducible defect closed in isolation with before/after receipt (above). Not deployed. Not merged.

## 5. Pre-existing red FIXED + PRs LANDED (owner-authorized)
```
FIX claim-maintenance-spec: producer owns machine_records (was hand-patched into derived index.json)
PR #2771 claim register: past-due reads are DUE_NOT_RUN, not SCHEDULED
  MERGED a0140c42 2026-10-01T10:54:13Z
PR #2772 claim-maintenance-spec: producer owns machine_records discovery map
  MERGED da0c6bc4 2026-10-01T10:54:17Z
master after land: da0c6bc45

PRODUCERS on landed master:
  node scripts/claim-maintenance-register.mjs --check  → OK 28 subjects / 99 claims
  node scripts/claim-maintenance-spec.mjs --check     → OK 6 derived files
  npx vitest run scripts/claim-maintenance-producers.test.mjs → 2 passed

NOTE: GHA still account-disabled (HTTP 422) — pr-gates never ran; mergeStateStatus CLEAN with empty checks.
NOTE: live /api/claims/register still shows SCHEDULED until deploy.yml can run (Actions disable blocks deploy).
```

## 6. Lane 4 continue — CHANGED_CONFIRMED end-to-end (publication HELD)

| Stage | Evidence |
|---|---|
| Source snapshot | registry `claimreg-ai-assurance-and-settlement-2026-09-23-rev2` sha256 `eff510e1f9af41d4e76e88361b1c6ef644365f9a7892a24d7ab648c21172e557` |
| Detected change | `scheduled-read` due 2026-09-28 → **CHANGED_CONFIRMED** at 2026-09-29T16:55:06Z (two reads ≥605s confirm-gap via `reread.mjs` sha256 `f5aea94d…`) |
| Claims moved | 18 candidates: CR-1..3, AR-1..2, LF-1..5, AN-1..2, MI-1..2, CS-1..4 (example CR-1: recorded_hash `beaeec8e…` → current_hash `35c84c64…`, url https://www.credo.ai/) |
| Event chain | `/api/claims/events` run `20260928T075152Z`: OBSERVED→MEASURED→c1..c4 CONFIRMED/REPRODUCED→11 atoms changed→SIGNED head `fddc08f7…` |
| Proposed correction | HF `…/claim-maintenance/candidates.jsonl` 29 rows; ids `cand-06a6cd0fe4dc5735-20260929T165506Z-*` |
| Evidence refs | outcomes.jsonl hash-linked rows (`row_sha256` 5255c0fb…); latest.json run_at 2026-10-01T08:01:10Z |
| Admission decision | **HELD — CANDIDATE only.** State: "for review; not an allegation and not a ledger entry". NOT promoted to /api/corrections. NOT an admitted board measurement. Missing metrics left null. |
| Publication gate | Explicit: a person promotes a candidate into the ledger. This session did not publish, did not label a proposal as measured. |

Also observed (not fixed here): `claimreg-ondo-chainlink-2026-09-22-rev2` day-7 first FETCH_FAILED then READ_NOT_COMPARABLE; hiring-platforms 2026-10-01 scheduled-read CHANGED_CONFIRMED with 11 more candidates (RH/GT/IN).

## 7. GO pass — land remaining MERGEABLE + rebase truth-critical
```
LANDED (squash):
  #2771 a0140c42  claim register DUE_NOT_RUN
  #2772 da0c6bc4  spec producer owns machine_records
  #2763           Interop: bind Harness X, Plugin X and SovX authority
  #2766           x402: bind settlement receipts to delivered bytes
  #2767           Interop: institutional rail evidence state model
  #2670           worker-quality readback
  #2671           retire unsupported CASA article claims
  #2673           verify legacy RunPod card body digests
  #2770           surface: refresh static headers to PRIMARY_LINKS brand-v1
  #2773 6ad83afbe fix(dashboard): expose source measurement date
master: 6ad83afbe

CLOSED:
  #2703 superseded by #2773 (Dashboard.tsx half obsolete; GspcWorkspaceHome owns UI now)
  #2705 obsolete — scripts/generate-public-indexes.py deleted in a9ff53af2;
       fail-closed nonnegative_count/repeat_payer_gate hand-off to functions/api/revenue.ts oneNumber()

REMAINING non-draft (still CONFLICTING/UNKNOWN):
  #2730 art50 Art 111(4)  #2684 nsite governance gate  #2672 ots stamp date
  #2669 repeat-buyer evidence  #2668 spray carries claim-spec

GHA still HTTP 422 — merges used mergeStateStatus CLEAN with empty checks (owner-authorized).
Deploy still blocked until Actions billing cleared.
```

## 8. GO pass complete — master fe6b08fa1
```
LANDED this pass:
  #2773 6ad83afbe  dashboard last_run_at (port of #2703 stats half)
  #2774 fe6b08fa1  ots receipt named for the day it ran (port of #2672 core)

CLOSED:
  #2703 superseded by #2773
  #2705 obsolete (generate-public-indexes.py deleted a9ff53af2) — gate logic hand-off to revenue.ts
  #2672 superseded by #2774 (date defect closed; pr-gates/LANES/tests not carried)

REMAINING non-draft:
  #2730 art50 Art 111(4) basis
  #2684 nsite governance discovery + fail-closed release gate
  (+ drafts and older CONFLICTING still open)

MASTER: fe6b08fa1
GHA: still HTTP 422 (owner billing). DEPLOY: still blocked on Actions.
```

## 9. Plan execution complete — master 68d5a2ab7

### LANDED this plan pass
| PR | Title | Note |
|---|---|---|
| #2666 | mill-sign skip already-signed | as-is CLEAN |
| #2662 | clarify public evidence count scopes | as-is CLEAN |
| #2679 | retired proof URLs Pages archive | undrafted + merged |
| #2677 | Pontes evidence boundary | undrafted + merged |
| #2775 | repeat payer evidence (port #2669) | 34 tests |
| #2776 | art50 Art 111(4) core (port #2730) | 17 tests |
| #2777 | governance discovery gate (additive #2684) | 7 tests |

### CLOSED
- #2669 superseded by #2775
- #2730 superseded by #2776 (mirror file list not carried)
- #2684 superseded by #2777 (gate removals NOT taken)
- #2668 too-divergent (100+ files) — narrow follow-up to gspc-spray.py only
- #2667 tooling absent from tree — lane 6 rebuild from pod scripts
- #2664 generator absent — restore a2a-tool-cards.mjs then regenerate
- #2656 release-owner handoff (deploy.yml name coupling to 5 workflow_run followers)

### LEFT OPEN (prepared handoffs, not landed)
Non-draft: #2661 discovery contracts · #2655–#2591 older measurement/x402/m4/ots batch (20 PRs)
Drafts: #2711 #2710 #2707 #2700 #2683 #2680 #2676 #2675 #2665

### Owner gates (unchanged)
1. Re-enable GitHub Actions (billing) — pr-gates + deploy still HTTP 422
2. Zenodo appeal (DOI UNAVAILABLE since 2026-09-29)
3. RunPod pod health (STATUS-MODELS double-blocked)

### Anonymous readback (descriptive UA)
```
200 125722 https://councilof.ai/
200 130496 https://councilof.ai/api/gspc
200 71534 https://councilof.ai/api/state
200 43593 https://councilof.ai/api/claims/register
200 2674 https://councilof.ai/governance/manifest.json
200 632 https://councilof.ai/.well-known/csoai-governance.json
```

MASTER TIP:
```
{"date":"2026-10-01T12:31:52Z","msg":"governance: canonical discovery + fail-closed release gate (#2777)\n\nPo","sha":"68d5a2ab7"}
```

NOTE: live claim register will still show SCHEDULED for past-due reads until deploy.yml can run (Actions 422 blocks deploy).

## 10. Remaining-20 PR pass complete

### LANDED (this pass)
| PR | Supersedes | Tests |
|---|---|---|
| #2778 | #2648 evidence-bundle subject in preview | 4 |
| #2779 | #2649 x402 buyer guide examples | 2 |
| #2781 | #2636 humanoid-labour-index regenerate + 3 leaks | 26/26 |
| #2782 | #2654 EffectBench instrument + Bazaar refresh | 5+8 |
| #2783 | #2653 Chainlink/Ondo discovery doors | 3 |

### CLOSED as already-on-master / obsolete / too-divergent
- #2641 volatile:true (already on master PRODUCERS.json)
- #2652 MCP identity (master already ai.councilof/gspc canonical)
- #2639 series rows (Eurostat dimension walk already on master)
- #2591 OTS batch v17 (99/100 files missing parents)
- #2651 evidence-factory (26/26 absent)
- #2650 Merkle erratum docs (2/2 absent)
- #2646 mailops (4/4 absent; outbound still owner-gated)
- #2645 runpod intake (3/4 absent)
- #2643 mirror source guard (4/6 absent)
- #2655 universal measure-sign (87/100 absent)
- #2647 evidence spine (48/87 absent; supersed by focused PRs)
- #2615 #2612 #2611 m4 batch (majority docs/tests absent)
- #2661 discovery contracts (merge-commit blast; isolated fixes already landed)

### LEFT OPEN (drafts — not force-landed)
#2711 #2710 #2707 #2700 #2683 #2680 #2676 #2675 #2665 + #2780 (other lane surface rename)

### Owner gates (unchanged)
1. Actions billing → pr-gates + deploy (HTTP 422)
2. Zenodo appeal (DOI UNAVAILABLE since 2026-09-29)
3. RunPod pod health

### Master tip + anonymous readback
```
{"date":"2026-10-01T15:16:21Z","msg":"feat(x402): add Chainlink and Ondo discovery doors (#2783)\n\nPort ","sha":"470122904"}
200 125722 https://councilof.ai/
200 130496 https://councilof.ai/api/gspc
200 71534 https://councilof.ai/api/state
200 43593 https://councilof.ai/api/claims/register
200 2559 https://councilof.ai/interop/financial-measure-run-humanoid-labour-index.json
200 2674 https://councilof.ai/governance/manifest.json
```

## 11. DO-IT pass — draft queue cleared

### LANDED
- #2780 surface: rename wrappers page titles
- #2784 sitemap: align with indexable canonical pages (3/3 tests)

### CLOSED this pass
- #2665 claim-capture delivery (18/18 files absent)
- #2680 quarantine historical OTS (20/23 absent)
- #2707 source convergence (100-file blast)
- #2711 staging lineage (100-file blast)
- #2710 RAS opportunity watch (8/11 absent)
- #2683 master sidebar (5 UI conflicts vs current DashboardLayout)
- #2676 pay-route ownership (6 conflicts; would regress #2784 sitemap) — re-cut core + pay-route-ownership test
- #2700 layer0 index refresh (8 generated-file conflicts) — re-run producers
- #2652 MCP identity (master already ahead)

### OPEN PR QUEUE
```
```

### Owner gates (unchanged)
1. Actions billing (pr-gates + deploy still HTTP 422)
2. Zenodo appeal (DOI UNAVAILABLE since 2026-09-29)
3. RunPod pod health

### Master + readback
```
{"date":"2026-10-01T15:30:26Z","msg":"sitemap: align with indexable canonical pages (#2784)\n\nPort of #2","sha":"441533e2c"}
200 125722 https://councilof.ai/
200 130496 https://councilof.ai/api/gspc
200 77977 https://councilof.ai/sitemap.xml
200 2674 https://councilof.ai/governance/manifest.json
```

## 12. GO follow-ups — leftovers from closed PRs

### LANDED
- #2785 openapi: nested capability lifecycle + stronger drift guard (from #2700 two-file leftover)
- #2788 pay: buyer page owns /pay, owner wallet tool owns /pay-all (re-cut #2676)

### Tests this pass
- capability-drift-guard: 1/1
- pay-route-ownership: 1/1
- PayEveryDoor: 23/23
- sitemap-indexability: 3/3

### Also fixed while recutting #2676
- generate-redirects REVIEWED_PUBLIC_HTML_APP_ROUTES += /governance (static discovery bundle #2777)

### Open PR queue: empty

### Owner gates (unchanged)
1. Actions billing (deploy + pr-gates HTTP 422)
2. Zenodo appeal
3. RunPod pod health

### Master
```
{"date":"2026-10-01T16:01:12Z","msg":"pay: buyer page owns /pay, owner wallet tool owns /pay-all (#2788","sha":"aa46d3ba6"}
```

## 13. Next items — Phase 1 drift close + C-2026-0930-01

### LANDED #2789
- 3 lifecycle: @openapi-unavailable → @openapi-retired (growth-loops, prod-readiness, synthesis); registry RETIRED
- 27 POST handler aliases no longer phantom 'NOT served' (x402 one-method-per-door)
- 6 discover doors registered (Chainlink / Ondo / Ondo-ousg)
- openapi.json regenerated (160 paths); offline http.ok=true
- C-2026-0930-01 status: CORRECTED; LIVE READBACK 2026-10-01

### Tests: capability-drift-guard 1/1 · truth-facades 6/6

### Also fixed (local tooling)
- Global git pre-push hook skipped MEOK proxy suite when script absent (was fail-closed on every non-MEOK repo)

### Owner gates (unchanged)
1. Actions billing (deploy + pr-gates HTTP 422) — live openapi still pre-#2789 until deploy
2. Zenodo appeal
3. RunPod pod health

### Master
```
{"date":"2026-10-01T16:50:35Z","msg":"estate: close capability-registry drift; refresh C-2026-0930-01 s","sha":"436448438"}
```
