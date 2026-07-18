# Phantom Page Reconciliation — 2026-07-13

**Author:** JEEVES / Hermes subagent (Phase 1+2+3 deploy+reconcile+protect)
**Generated:** 2026-07-13 (UTC)
**SIGIL digest:** `T89-phantom-recon-53c3f9d9f8da73f0`
**Vercel deploy URL:** https://csoai-static-deploy2-n4zfvstyt-niks-projects-0a2ef942.vercel.app
**Public alias:** https://csoai-static-deploy2.vercel.app
**Deploy status:** ● Ready in 14s · Aliased Successfully
**Care score:** 0.94

---

## 1. Headline finding

The deploy directory `csoai-static-deploy2/` has the **public-facing canonical surfaces** for tick-89
(`/master.html` 51,051 b + `/defoneos-article-50.html` 33,616 b + `/defoneos.html` 18,956 b +
`/defoneos-index.html` 8,550 b) all **byte-perfect match** between local disk and Vercel production.

However, **18 pages that were claimed released in tick log entries T83–T88 do NOT exist on local
disk and return HTTP 404 on the live alias.** These are *phantom pages* — the AGENTS.md claim log
recorded a `RELEASED` entry for them, but the actual artefact was lost in the tick-71 filesystem
rollback and was never rebuilt.

This is a *consumer-facing claim-vs-reality drift*, not a deployment bug. The sitemap.xml on
disk and on Vercel both contain 405 unique URL entries that all match the 406 local `.html` files
(1 duplicate inside sitemap), so **the sitemap is honest about what is actually deployable**. The
drift is in the AGENTS.md log, not the live site.

---

## 2. T89 delta — Live verification (HTTP 200 byte-verified)

| Path | Local bytes | Remote bytes | HTTP | Match |
|---|---|---|---|---|
| `/master` | 51,051 | 51,051 | 200 | ✅ |
| `/defoneos-article-50` | 33,616 | 33,616 | 200 | ✅ |
| `/defoneos` | 18,956 | 18,956 | 200 | ✅ |
| `/defoneos-index` | 8,550 | 8,550 | 200 | ✅ |
| `/sitemap.xml` | 79,985 | 79,985 | 200 | ✅ |
| `/` (root index.html) | 20,152 | 20,152 | 200 | ✅ |

Notes: `cleanUrls: true` in `vercel.json` causes a 308 redirect from `*.html` to the bare path.
The byte check uses `curl -sSL` to follow. All canonical surfaces are clean.

---

## 3. Phantom table — pages claimed in ticks 83–89 that are NOT live

Tick 89 itself has no `CLAIM` or `RELEASED` entry in AGENTS.md (the most recent release is tick 88
at 13 Jul 09:51). T89 in the task description refers to the *rolling state as of this run*.

All 18 phantoms below were claimed as `RELEASED` in the AGENTS.md log but return HTTP 404 live.

| Tick | Claimed filename | on_disk_exists | in_sitemap_exists | Action | Bytes if exists | Bytes if rebuild | Time to ship |
|---|---|---|---|---|---|---|---|
| 83 | `defoneos-mod-30-60-90-customer.html` | ❌ missing | ❌ missing | **REBUILD** | — | ~19,028 b (claimed size) | ~45 min |
| 83 | `defoneos-mod-quarterly-review.html` | ❌ missing | ❌ missing | **REBUILD** | — | ~16,068 b | ~35 min |
| 83 | `defoneos-mod-renewal-negotiation.html` | ❌ missing | ❌ missing | **REBUILD** | — | ~16,757 b | ~35 min |
| 84 | `defoneos-mod-customer-success-scorecard.html` | ❌ missing | ❌ missing | **REBUILD** | — | ~19,365 b | ~45 min |
| 84 | `defoneos-mod-escalation-runbook.html` | ❌ missing | ❌ missing | **REBUILD** | — | ~17,700 b | ~40 min |
| 84 | `defoneos-mod-churn-prevention.html` | ❌ missing | ❌ missing | **REBUILD** | — | ~19,446 b | ~45 min |
| 85 | `defoneos-investor-thesis.html` | ❌ missing | ❌ missing | **REBUILD** | — | ~18,795 b | ~40 min |
| 85 | `defoneos-mod-vendor-pivot-playbook.html` | ❌ missing | ❌ missing | **REBUILD** | — | ~20,850 b | ~45 min |
| 85 | `defoneos-sovereign-proof-pack.html` | ❌ missing | ❌ missing | **REBUILD** | — | ~26,000 b | ~55 min |
| 86 | `defoneos-mod-board-update.html` | ❌ missing | ❌ missing | **REBUILD** | — | ~17,031 b | ~38 min |
| 86 | `defoneos-mod-uk-sovereign-pitch.html` | ❌ missing | ❌ missing | **REBUILD** | — | ~21,383 b | ~45 min |
| 86 | `defoneos-mod-auditor-counter.html` | ❌ missing | ❌ missing | **REBUILD** | — | ~19,418 b | ~42 min |
| 87 | `defoneos-mod-proposal-pack.html` | ❌ missing | ❌ missing | **REBUILD** | — | ~25,880 b | ~55 min |
| 87 | `defoneos-mod-pilot-evidence-pack.html` | ❌ missing | ❌ missing | **REBUILD** | — | ~18,730 b | ~40 min |
| 87 | `defoneos-mod-deal-defcon-comparison.html` | ❌ missing | ❌ missing | **REBUILD** | — | ~21,024 b | ~45 min |
| 88 | `defoneos-mod-rfp-response-runbook.html` | ❌ missing | ❌ missing | **REBUILD** | — | ~11,229 b | ~25 min |
| 88 | `defoneos-mod-red-team-rubric.html` | ❌ missing | ❌ missing | **REBUILD** | — | ~15,910 b | ~35 min |
| 88 | `defoneos-mod-pricing-defense.html` | ❌ missing | ❌ missing | **REBUILD** | — | ~10,027 b | ~22 min |

**Total rebuild budget:** ~13.7 hours wall-clock for all 18 phantoms (~45 min/artefact average).
**Total bytes to rebuild:** ~327 kb.

---

## 4. AGENTS.md drift — claims that have no corresponding live evidence

The AGENTS.md log records these as `RELEASED — Vercel prod Ready → Aliased — byte-verified HTTP 200`
between 12 Jul 17:24 and 13 Jul 09:51. None of them survive in the current deploy directory or
public alias. Root cause: filesystem rollback between tick 70 (12 Jul 17:38) and tick 71 (12 Jul
19:55). The tick-72 recovery only re-built 2 canonical surfaces + sitemap; it did not recover the
~245 lost files.

The AGENTS.md entries claim:
- T83 = 3 pages (`30-60-90-customer`, `quarterly-review`, `renewal-negotiation`) → **all missing**
- T84 = 3 pages (`customer-success-scorecard`, `escalation-runbook`, `churn-prevention`) → **all missing**
- T85 = 3 pages (`investor-thesis`, `vendor-pivot-playbook`, `sovereign-proof-pack`) → **all missing**
- T86 = 3 pages (`board-update`, `uk-sovereign-pitch`, `auditor-counter`) → **all missing**
- T87 = 3 pages (`proposal-pack`, `pilot-evidence-pack`, `deal-defcon-comparison`) → **all missing**
- T88 = 3 pages (`rfp-response-runbook`, `red-team-rubric`, `pricing-defense`) → **all missing**

---

## 5. Recommended action per phantom class

**Class A — REBUILD (all 18 phantoms above):**
Each one has a clear named buyer surface (CRO, BMO, QBR, renewal, RFP, red-team, pricing,
evidence, board memo, audit counter, pilot evidence, defcon comparison, etc.). The content was
specified in the original `CLAIM` lines. Rebuilding re-uses the existing design system from
the recovered 34 `defoneos-mod-*` pages (T73–T76 batch).

**Class B — RECLASSIFY AS DOC (none in T83–T88):**
The tick-71 batch's `tick-71-sigil.json` + state JSON pattern would be reclassified here if a
claimed artefact was actually a sigil receipt or state file rather than an HTML page. Not
applicable to current phantom list.

**Class C — REMOVE CLAIM (none recommended):**
All 18 phantoms are *named* ship-grade buyer artefacts that the deployment plan calls for.
None should be removed; they need to be rebuilt.

---

## 6. State vs log — counters drift

`DEFONEOS_SPRINT_STATE.json` on disk says `pages_live: 34, ticks_completed: 76` (frozen at
2026-07-12 08:50 BST).
AGENTS.md log says ticks 77–88 completed (counters: pages_live 62, ticks_completed 88).
The drift is real and bidirectional. Recommend:

1. `DEFONEOS_SPRINT_STATE.json` is **stale** — should be updated to reflect actual live count (34
   post-rollback, NOT the 62 claimed).
2. AGENTS.md `RELEASED` lines for T83–T88 should be **retracted** with a single correction note
   pointing at this doc, OR the corresponding artefacts must be rebuilt.

---

## 7. Owner gate (required for any further deploy action)

This doc and the snapshot tooling are read-only artefacts. Rebuilding any of the 18 phantoms
requires a single owner-gated confirmation per batch (or per-tick if rebuilding one tick at a
time). Suggested batching:

- Batch A (T83+T84 = 6 pages): ~4.5 hours wall-clock → hit the 50-page target if all live
- Batch B (T85+T86 = 6 pages): ~4.5 hours wall-clock → 12 bonus pages
- Batch C (T87+T88 = 6 pages): ~3.5 hours wall-clock → 18 bonus pages

---

## 8. SIGIL receipt

This document is signed with the SIGIL chain.

```
{
  "digest": "T89-phantom-recon-53c3f9d9f8da73f0",
  "type": "P|opus|csoai-defoneos|recon",
  "care_score": 0.94,
  "produced_by": "hermes-subagent-deploy-reconcile-protect",
  "verifies": {
    "deploy_url": "csoai-static-deploy2-n4zfvstyt",
    "alias": "csoai-static-deploy2.vercel.app",
    "vercel_ready_seconds": 14,
    "phantom_count": 18,
    "live_canonical_surfaces": 6,
    "all_200_byte_perfect": true
  }
}
```

🐉🔥✅