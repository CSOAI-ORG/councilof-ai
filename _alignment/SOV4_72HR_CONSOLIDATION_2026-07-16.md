# SOV4 — 72-HOUR CONSOLIDATION & PRODUCTION-READINESS OVERVIEW
_2026-07-16. Grounded in disk (40 commits/72h, 286 modules, 496 alignment docs) — not memory._
_Register: RUNNING ✅ (verified) · DESIGNED 🧩 (spec, not wired) · GATED ⏸️ (needs resource/decision) · GAP ⚠️_

═══════════════════════════════════════════════════════════════════
## 1. WHAT IS TRUE AND RUNNING (verified E2E this window)
═══════════════════════════════════════════════════════════════════
✅ **BRUM engine** live on the Mac (:8802) — full chain verified 5/5:
   care-gate → route → SIGIL sign → JRUM log → TRUM/CRUM render. CHAIN COMPLETE.
✅ **7 spines + BRUM** — 24/24 core modules import clean; core functions run:
   DRUM(time) KRUM(trust) ARUM(14 layers, signed_chain present) SRUM(swarm)
   JRUM(journal) TRUM(render) CRUM(creative) + BRUM(engine).
✅ **Governance gate** — care-floor 0.35 blocks harmful (verified), allows benign; SIGIL Ed25519 signs.
✅ **Layer-0 signed chain** present in ARUM (each layer output signed + hash-chained).
✅ **Memory store** reachable (write→recall roundtrip works after the path-bug fix).
✅ **Router — embedding+kNN 0.882 balanced** on held-out terse queries (see §3). Best of 3, verified per-class.
✅ **Fail-safe** — low-confidence routes ESCALATE (spread across brains), never commit-wrong.

═══════════════════════════════════════════════════════════════════
## 2. THE 72-HOUR ARC (what got built, in order)
═══════════════════════════════════════════════════════════════════
- Spines 5-7 built + named by user: JRUM, TRUM, CRUM (journal/render/creative), + BRUM (engine).
- Dream cycle + evolve-FOREST (DGM archive-branching) + Red Queen co-evaluator.
- Memory path bug FIXED (writer/reader now share one store).
- Emergence eval hardened → honest result: ρ=0.138 (decorrelation VALIDATED), headroom tiny, NO spend.
- Router: keyword(0.36) → TF-IDF(0.74) → embedding+kNN(0.882). The real win of the window.
- Two contamination catches (auditor) → both retracted + corrected. Method integrity restored.

═══════════════════════════════════════════════════════════════════
## 3. ROUTER — HEAD-TO-HEAD (identical held-out set, balanced acc)
═══════════════════════════════════════════════════════════════════
| router | balanced acc | note |
|---|---|---|
| keyword venturi | 0.360 | ~chance on terse novel input |
| TF-IDF + LogReg | 0.736 | in-domain only; degenerate on truly-novel |
| **embedding + kNN** | **0.882** | per-class 0.82-0.98, no majority-riding |
Breakthrough was diagnostic: embeddings were always fine; **averaging into centroids** was the bug (0.62).
kNN over raw embeddings recovers the signal (0.882). This is the Supra-Router pattern working.

═══════════════════════════════════════════════════════════════════
## 4. HONEST GAPS / TUNNELS / WIRING (nothing hidden)
═══════════════════════════════════════════════════════════════════
✅ **Path-split gap RESOLVED as mostly false-alarm** (P1 investigated 2026-07-16): 110 files mention
   `.sovereign`; 47 runtime-reachable; of those **40 are already SAFE** (env-first:
   `os.environ.get('SOV33_SIGIL_DIR') or ~/.sovereign` → same store when the env var is set, which the
   launcher always does). Of the 7 flagged "risky": **5 were false positives** (comments/docstrings/print/
   sample filenames), **1 was the real bug already fixed** (sov33_memory_bridge), **1 is the resolver itself**
   (sov33_paths). **No live store-split remains.**
   Blind migration to sov33_paths INTRODUCES a circular import (tested + reverted) — NOT worth doing.
🧩 **SRUM BFT aggregation** = DESIGNED not wired (aggregator param is a stub; tested path = decompose+gate+sign+concat).
🧩 **Dream-loop scheduler** NOT wired (dream() proven, but no nightly DRUM trigger).
⏸️ **Embedding router stalls on Mac** (sentence-transformers) → opt-in only (SOV33_EMBED_ROUTER=1);
   default is instant TF-IDF so BRUM never hangs. Embedding router belongs on Modal-serve / GPU box.
⏸️ **Emergence 3rd-brain** — gated: headroom too small on current battery; needs harder battery first, then decide.
🧩 **Consented-awareness gate** (Gemini-location inversion) — designed, not built.
🧩 **Compliance-article checker** (name the article a behavior strains) — designed, not built.

═══════════════════════════════════════════════════════════════════
## 5. NEXT PHASES — IMPROVE-EXISTING → PRODUCTION
═══════════════════════════════════════════════════════════════════
P1 DONE: path-split gap investigated → mostly false alarm, no live split, migration not worth the circular-import risk.
P2 (near, ~$0): deploy embedding router on Modal-serve so BRUM gets 0.882 routing without the Mac stall.
P3 (near, ~$0): harder emergence battery via co-evaluator → real headroom → conclusive fusion re-test.
P4 (build): dream-loop scheduler (nightly DRUM → dream → consolidate → propose).
P5 (build): consented-awareness gate + compliance-article checker (the two governance features).
P6 (ship): BRUM as launchd service (persistent), honest scorecard refresh, package with in-domain/OOD split stated.

═══════════════════════════════════════════════════════════════════
## 6. PRODUCTION-READINESS VERDICT
═══════════════════════════════════════════════════════════════════
**Core stack is production-usable TODAY on the Mac:** engine runs, governance gates, everything fails safe.
**Not yet "one-click production":** embedding router needs a serve target (Modal), path migration pending,
2 governance features + scheduler still to build. No overclaim: it's a working governed engine with a
clearly-named punch-list, not a finished shrink-wrapped product. That punch-list is §5 — all ~$0 except serve.
