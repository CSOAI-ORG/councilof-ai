# SOV4 FULL-STACK BUILD CHECKLIST (2026-07-16, aligned to all we now know)
_[x]=done+verified · [~]=partial/gated · [ ]=todo. Honest register: RUNNING/TESTED/DESIGNED/GATED._

## PHASE 0 — ENGINE (DONE)
[x] BRUM intelligence spine — drive() routes + escalates, unifies router/venturi/swarm
[x] launch_brum.sh — venv auto-use, port-kill, preflight (router/care/SIGIL), root status page
[x] sov_openai_shim — governed OpenAI endpoint :8802, care-floor 0.35, SIGIL signing
[x] Full E2E chain verified: route→care-gate→SIGIL→JRUM→TRUM/CRUM (CHAIN COMPLETE)
[x] BRUM LIVE on the Mac (5 backends: groq/nvidia/ollama/kimi/claude)

## PHASE 1 — 7 SPINES (DONE, verified across runs)
[x] DRUM (time/clock/ledger) · KRUM (Byzantine trust) · ARUM (14 layers)
[x] SRUM (governed swarm) · JRUM (journal+dream+forest) · TRUM (render transform) · CRUM (creative repr)

## PHASE 2 — ROUTER (the real current work)
[x] v1 trained router: 0.716 held-out vs keyword 0.393
[x] v2 recalibrated: 0.822 in-domain, confidence DISCRIMINATES (0.8→~100%, 0.4→~32%) [IN-DOMAIN only]
[x] Reliability curve measured (proper held-out split — clean, not contaminated)
[x] BRUM escalation threshold set to 0.8 (measured cliff), fails SAFE on low conf
[~] OOD generalization: WEAK (2/5 on terse held-out prompts) — REAL BLOCKER
[ ] **P2a: build terse-governance-query dataset** (RAG corpus → short labeled queries per node) ← NEXT
[ ] P2b: retrain v4 on real terse data, re-measure OOD (target ≥4/5 held-out terse)
[ ] P2c: confirm in-domain reliability preserved after OOD fix

## PHASE 3 — EMERGENCE / FUSION (gated on Phase 2)
[x] Hardened eval: Qwen 0.917/Bamba 0.708, rho=0.138 (LOW — thesis validated)
[x] Confidence-routing SIM (in-domain): defer-low-30% → accuracy 0.798→1.00 monotonic
[~] Honest gate: headroom=1 item (too small to be conclusive); OOD router weak
[ ] P3a: harder battery via co-evaluator (leave >1 item headroom even for best brain)
[ ] P3b: re-run 2-brain eval with v4 router confidence-routing (only after P2 fixes OOD)
[ ] P3c: DECISION — 3rd brain only if headroom>threshold AND v4 confidence can capture it

## PHASE 4 — MEMORY / PATHS (partial)
[x] Memory path bug fixed (2 modules) + sov33_paths.py resolver
[ ] P4a: migrate remaining 35 modules to sov33_paths.py
[ ] P4b: dream-loop scheduler (nightly DRUM tick → dream() → consolidate)

## PHASE 5 — GOVERNANCE FEATURES (designed, not built)
[ ] P5a: consented-awareness gate (the Gemini-location inversion: detect→ask→sign consent→show use→revocable)
[ ] P5b: compliance-article checker (given a behavior, name the article it strains: AI Act 50 / GDPR 6/13)

## PHASE 6 — HARDEN + SHIP
[ ] P6a: fail-safe audit across all spines (verify each degrades safe on error)
[ ] P6b: honest scorecard refresh (in-domain vs OOD split stated everywhere)
[ ] P6c: BRUM as launchd service (persistent, survives reboot) — user runs on Mac

## HONEST GATES (do not cross without evidence)
- No flagship 3rd-brain spend until harder battery + v4 router show capturable headroom
- Never report in-domain numbers as if OOD (the contamination lesson — always state the split)
- Router OOD generalization is the true blocker; fix with real terse data, not augmentation tricks
