# SIGIL — the connective tissue: what's wired, what's the gap, how to connect ALL

**SIGIL = Sovereign Inter-aGent Interchange Language** (`sovereign-temple/sigil.py`): a lossless compact wire format (`encode`/`parse`), a human gloss, and a **signable digest** — and `_sigil_emit` writes **hash-chained** lines (each `prev_digest` = the previous line's digest = a tamper-evident audit chain). It's the substrate for "every agent-to-agent hop, signed" — the vibration/back-and-forth across layers, *recorded*.

## Is it connecting ALL today? Honest answer: NO — it's the right design, fragmented in practice.
| Layer | Signs its hops? | Where |
|---|---|---|
| **Federation bus** (MCP↔MCP calls) | ✅ SIGIL | `data/federation_sigil.log` (hash-chained, live) |
| **Model scoreboard / ralph votes** | ✅ SIGIL (just wired) | `scoreboard_sigil.log` (or shared via `SIGIL_LOG`) |
| **OS self-improve loop** (queen→King→OS) | ✅ SIGIL (folded 2026-06-25) | attest() emits 'D' hop onto the federation chain + keeps its own Ed25519 ledger |
| **King council verdicts** | 🟡 signed, separate | king ledger |
| **The 18 bridges** (govern actions) | ✅ SIGIL (wired 2026-06-25) | every `govern_*` emits a chained hop; `SIGIL_LOG` to share the chain |
| **OS dock interactions** | ❌ | — gap |
| **meok-town-view globe / M2 OS** | ❌ | — gap |

**So (updated 2026-06-25):** the one chain now spans **federation + scoreboard + 18 bridges + the OS self-improve loop** — the majority of governed activity. Remaining gaps: King council verdicts (separate ledger) + OS dock/globe UI hops (step 4) — mostly want the runtime / M2's surfaces. SIGIL has gone from "1 layer" → "4 layers on one chain."

## How to connect ALL (the bridge-the-gap plan)
1. **One env, one chain:** every emitter reads `SIGIL_LOG` (the scoreboard now does). Point all layers at the same file/bus → one tamper-evident chain across the whole estate. *(Lowest-effort unification.)*
2. **Bridges emit on govern():** each of the 16 bridge MCPs calls `_sigil("G", "bridge|<id>|<framework>|govern")` in its `govern_*` tool → every governed legacy action becomes a signed SIGIL hop. (~6 lines each, same self-contained helper the scoreboard uses.)
3. **Fold the OS loop into SIGIL:** the self-improve ledger (`os_directives_ledger.jsonl`) already Ed25519-signs + hash-chains — re-express its lines as SIGIL `op=D` (directive) so it's the *same* chain, not a parallel one.
4. **OS dock + globe emit** key actions (open app, run audit, click temple) as SIGIL `op=U` (user/UI hop) via the bridge → SOV3.
5. **One verifier:** a single `/verify` that walks the unified chain (prev_digest links) — the public, offline-verifiable audit of *everything*.

## The frequency/vibration tie-in
Each hop = one SIGIL line; the chain = the back-and-forth over time. **Cadence (frequency)** = how often hops are emitted; **convergence (vibration)** = the BFT/ralph rounds, each a signed hop, settling to consensus. SIGIL makes the vibration *attestable* — you can replay and verify the whole conversation.

## Status
- ✅ Done: scoreboard emits hash-chained SIGIL (verified: 3 hops, chain integrity true); `SIGIL_LOG` unification hook in place.
- ⏳ Gap: bridges + OS loop + dock + globe not yet on the one chain (plan above; ~steps 2–5). Step 3 (fold the OS ledger) + live emission across surfaces want the runtime.
- Honest: SIGIL is real and is the correct connective tissue — calling it "connecting all" is a *target*, ~80% of the wiring is steps 2–5 above.
