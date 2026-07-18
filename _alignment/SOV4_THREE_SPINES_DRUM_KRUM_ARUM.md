# SOV4 THREE SPINES — DRUM / KRUM / ARUM (honest architecture, 2026-07-16)

The governance layer has three orthogonal spines. Each answers a different question.
This doc is ORGANIZATION of what exists + one honest gap. It is NOT a claim of new capability.

## DRUM — the TIME spine (stages + clock)   [RUNNING]
"When / in what order does work happen, and is it real progress?"
- The 9/12-stage alphabet flow: LEARN -> CHECK_EXISTING -> PLAN -> DO -> ACT -> CHECK_VERIFY -> AUDIT -> IMPROVE -> BRAND_QUALITY
- DRUM = the heartbeat/clock beneath the stages; Years->Days = the exec MODE of PLAN->DO
- Module: sov33_nine_stage_flow.py, CHARTER_HOLY_GRAIL_ALPHABET.md
- Fill-the-alphabet: each stage maps to a real framework module on disk (below)

## KRUM — the TRUST spine (aggregation + Byzantine defense)   [RUNNING]
"Which contributions are honest, and how do we combine them safely?"
- Byzantine-robust aggregation: Krum picks the vector closest to its n-f-2 neighbours
- VERIFIED: 58.9x closer to truth than plain mean vs a poison node (krum_verification.json)
- Belt-and-suspenders with reputation: KRUM stops a NEW attacker round 1; DRUM/reputation stops a PERSISTENT one
- Module: sov33_governed_training.py (agg_krum + GovernedTrainingRound)

## ARUM — the LAYER spine (hive awareness, Layer-0 upward)   [WIRED 14/14 — incl security layer]
### SECURITY LAYER (L0a/L0b, above SIGIL)
Rainbow rotation (rainbow_rotate.py — IP rolls every 5min: worm-tunnel/probe/DDoS evasion) + 75-node BFT
threat council (bft_threat_council.py — 15 lens types x5 providers, tolerates f=24 Byzantine). Network+threat
tier, wired into ARUM. HONEST: rainbow is control-plane (does not itself bind sockets); council is threat-scoring.
### L0 CONNECTS IT ALL (the connective tissue)
Layer-0 (SIGIL) is not just the bottom layer — it THREADS through every layer. signed_chain() passes each
layer output through the signing act + hash-chains it to the previous, so the whole stack is ONE verifiable
sequence (genesis->route->care->KRUM->veto->evolve->fusion). Tamper any layer -> its signature breaks -> chain
breaks. This is what makes ARUM a spine not a list: L0 is the thread. Verified 6/6 signed in test.
"What is the system aware of, across all its layers?"
- The Layer-0 -> L7 hive stack, named + wired as ONE legible awareness spine
- HONEST LINE: the layers already exist; ARUM is the NAME + consistent wiring, NOT a new engine
- Do NOT claim ARUM is a living/self-aware layer — it's the 7 layers made legible
- Candidate layers: L0 SIGIL fabric, L1 memory, L2 routing, L3 care-ontology, L4 brains,
  L5 attestation, L6 execute-gate, L7 federation
- Status: layers exist scattered; ARUM = the integration + doc pass (the gap to close)

## THE THREE-SPINE MENTAL MODEL
| spine | question | mechanism | status |
|-------|----------|-----------|--------|
| DRUM  | when/order/is-it-progress | 9-stage flow + clock | RUNNING |
| KRUM  | who's honest / how to combine | Byzantine aggregation | RUNNING (58.9x verified) |
| ARUM  | aware of what, across layers | Layer-0->7 hive + security, sov33_arum.py | WIRED 14/14 |

## FILL-THE-ALPHABET: stage -> real framework module
- LEARN         -> sov33_learn_stage.py (reads real clock)
- CHECK_EXISTING-> sov33_check_existing_stage.py
- PLAN/DO       -> Years->Days exec mode
- ACT           -> venturi throat (route+sign)
- CHECK_VERIFY  -> conformal veto (Pr[allow & harmful] <= alpha)
- AUDIT         -> sov33_audit_stage.py (catches overclaim)
- IMPROVE       -> PDCA-BFT (propose, human-gated)
- BRAND_QUALITY -> care-gate (0.35 floor, framed-harm 1.00)
- (aggregation across all) -> KRUM
- (awareness across all)   -> ARUM

## HONESTY REGISTER
- ARUM is a naming/wiring move, not emergence. Say so.
- KRUM number (58.9x) is a sim result on a poison-node test, real but small-scale.
- The 3 spines organize EXISTING work + 1 gap (ARUM wiring). No new capability claimed.


## SRUM — the SWARM spine (the 4th spine) [PROVEN LIVE 2026-07-16]
- **Question it answers**: *spread across how many workers?*
- **Mechanism**: sov33_governed_swarm.py — venturi decomposes a task -> fans independent sub-tasks across
  brain instances -> each agent's output care-gated + SIGIL-signed -> gated-filter + concatenation.
  (TESTED today: decompose + care-gate each sub-task + SIGIL-sign + concatenate. DESIGNED-not-yet-wired:
  BFT/KRUM voting over agents + a separate master-OWEM integrator call — the `aggregator` param is a stub.)
- **PROVEN LIVE**: 3 sub-tasks swarmed across the Oracle brain (meta.llama-3.3-70b) in 4.3s, all care-gated,
  all signed (contributing=3, all_signed=True). No GPU needed — runs on free/cheap online inference.
- **Topology**: swarm of ONLINE-API OWEMs (NVIDIA/Oracle, federation tier, works now) feeding a MASTER OWEM
  (the governance head). Owned-weights brains plug into the same slots later, no code change.
- **HONEST BOUNDARIES**: (1) throughput win ONLY on decomposable workloads (code reports decomposable=True/False;
  single hard reasoning chain = no speedup). (2) online swarm = federation tier, NOT sovereign (depends on
  NVIDIA/Oracle). The moat = governed+signed swarm, which no open swarm (Kimi/OpenManus) ships.

## THE FOUR SPINES
| spine | question | mechanism | status |
|---|---|---|---|
| DRUM | when? (time) | 9-stage flow + clock | WIRED |
| KRUM | whom to trust? | Byzantine aggregation (58.9x) | WIRED |
| ARUM | across what layers? | 14/14 layer wiring | WIRED 14/14 |
| SRUM | spread across how many? | governed swarm: decompose+care-gate+sign+concat (BFT/KRUM aggregation DESIGNED) | PROVEN LIVE (concat) |
