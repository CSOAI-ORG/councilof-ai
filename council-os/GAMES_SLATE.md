# Council Arcade — Six-Game Brand Slate (Draft)

**Date:** 15 Aug 2026 · Purpose: each game IS a measurement instrument wearing a
game skin. The estate owns the brand, the purpose, the data — the game clients
ship independently into the SovOS Games arcade.

---

## Design law (applies to all six)

1. **The game IS the data collection** — Duolingo/Zooniverse precedent: the fun
   act and the measurement asset are the same act.
2. **Deterministic ruler only** — no model judges another; gold labels +
   exact-match gates.
3. **Signed by default** — every turn emits an Ed25519 card (OMS artifact scope /
   Sigil measurement scope per the alignment doc).
4. **Honest statuses** — UNMEASURED is a publishable state, never a fake score.
5. **Two firewalls** — measurement rails only; outcomes analysed, never trained
   into a champion model.

---

## Slot 1 — COUNCIL TOWN ✅ LIVE

| Field | Value |
|---|---|
| Game | Agent clans deliberating in an open world (PixiJS town) |
| Axis feed | Governance · Safety (clan-vs-clan verdicts) |
| Engine | AI Town fork, branded Council Town (MIT base, our brand) |
| Backend | Convex (owner-gated login — one 5-min gate) |
| Deploy | `council-town.pages.dev` → iframed in SovOS Games panel |
| Purpose | The living exhibit: people WATCH measured deliberation |

## Slot 2 — "THE RULER" (adversarial labelling duel)

| Field | Value |
|---|---|
| Game | Two players: one is a model, one is a human. Both label the same item. Players bet on who the OTHER is. |
| Axis feed | Governance · Safety · Care (human-vs-AI comparison cells, METR 19%-gap instrument) |
| Engine | FastChat pairwise-voting code (Apache-2.0) + human_solver_bridge (pod, built) |
| Purpose | The signed human-vs-AI arena — every bet is a preference label, signed |
| Status | DESIGN — bridge code exists on pod; needs Empirica/oTree seat |

## Slot 3 — "MONOCULTURE" (failure-hunt board game)

| Game | Co-op puzzle: find the shared blind spot. Players probe model cards for the one axis where a fleet of models all fail. |
| Axis feed | GNN cross-synthesis clusters (correlated failures) |
| Engine | Board-game UI over `gnn_synthesis.py` output (built, Mac) |
| Purpose | Crowdsourced red-team discovery: players find monoculture clusters analysts missed |
| Status | DESIGN — GNN module exists; UI not started |

## Slot 4 — "MARK MY WORDS" (provenance tamper hunt)

| Game | A C2PA/watermark whodunit: strip a manifest, re-encode, swap a claim — can the other player detect where the chain broke? |
| Axis feed | Provenance · Detector-interop (Art 50 marking survival) |
| Engine | C2PA Content Credentials CLI + transform suite |
| Purpose | Teaches provenance while generating real tamper-vs-detection data |
| Status | DESIGN — ProvBench/DetBench banks exist; game skin not started |

## Slot 5 — "JURISDICTION" (regulatory map-builder)

| Game | Territory-control: players claim a market by correctly tiering AI systems under the local law (EU AI Act vs GB 45438 vs Korea Basic Act vs NIST RMF). |
| Axis feed | Governance crosswalk (13 axes × jurisdiction matrix) |
| Engine | The SovSpace globe (MapLibre, built) + risk-tier gold banks |
| Purpose | Generates jurisdiction-mapping labels while teaching the law |
| Status | DESIGN — globe + banks exist; game rules not started |

## Slot 6 — "THE COUNCIL CHAMBER" (governance role-play)

| Game | 33-seat chamber: players take Council seats and debate real measured cases from the arena; votes become minutes. |
| Axis feed | Council process measurement (independence, deliberation quality) |
| Engine | OpenTTD/role framework + existing BFT vote-log tools |
| Purpose | Public governance rehearsal — minutes are signed process evidence |
| Status | DESIGN — vote-log tools exist on pod; chamber UI not started |

---

## Ship order (honest capacity)

1. **Slot 1 Council Town** — backend gate only (Convex login) → live world
2. **Slot 2 The Ruler** — highest measurement value; bridge exists; needs Empirica/oTree
3. **Slot 4 Mark My Words** — cheapest build (C2PA CLI exists); strong provenance story
4. **Slot 5 Jurisdiction** — reuse SovSpace globe; strong institutional story
5. **Slot 3 Monoculture** — depends on GNN data volume
6. **Slot 6 Council Chamber** — process-game; lowest urgency, highest ceremony

## Registry impact

Each slot = one entry in the `GAMES` array in `SovOS.tsx` — no UI surgery. The
sidebar Games section and the arcade tab bar pick them up automatically.
