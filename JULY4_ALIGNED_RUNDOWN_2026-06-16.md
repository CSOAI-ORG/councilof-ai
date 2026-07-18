# MEOK — Aligned Rundown to July 4 Launch
**2026-06-16. One coherent picture across the engine, the moat, openpatent, revenue, and the systems. ~18 days to launch.**

> Hermes could not be consulted live (its `OPENAI_API_KEY` is 401'd — **rotate that key**; it's also the cause of the cloud-brain timeouts). This rundown aligns across the systems from the code + inventory; Hermes sign-off is a 5-min step once the key is fixed.

## 1. The aligned picture (what is now TRUE, drift removed)
- **ONE engine.** `~/clawd/meok-one/meok_one/` (`:3200`). A King routes to 29 Queens = 29 `stack.yml` configs. Horus (12-lens) audits, Harmony reconciles, SOV3 (`:3101`) is memory. Canonical decisions recorded (`CANONICAL_DECISIONS_2026-06-16.md`) — openmoe-bft = unwired reference, council = 12 (not 33/36), brand triplets mapped.
- **The product is now provable, not just asserted.** Verified self-improving compliance loop: grounded generation → external verifier (incl. *factual* citation check) → verified-best of N → tamper-evident audit. Proven: citation 0.00→1.00 when grounded; held-out lift +0.25.
- **The work patents itself.** openpatent.ai woven in: every hive artifact → tamper-evident, SIGIL-anchored, optionally proofof.ai-certified invention disclosure. IP ledger chain intact (165 records).
- **Revenue rails are live** (from earlier today): attestation provision→sign→verify works; metering leak closed; Upstash KV wired; Stripe ladder + LAUNCH50 live.

## 2. What we now HAVE (asset inventory, post-session)
| Asset | State |
|---|---|
| Verified-compliance engine (`verifier.py` + grounded queen) | ✅ built + proven |
| `regulation_kb.py` (the moat seed) | ✅ EU AI Act + DORA + NIS2 facts |
| `openpatent.py` (IP-as-you-operate) | ✅ built + ledger intact |
| `brain_tournament.py` (4 mindsets A/B) | ✅ built, Pareto-proven |
| Attestation API (provision/sign/verify, metering closed) | ✅ live |
| 29 hive configs + 532 GitHub repos + ~271 MCPs | ✅ exist (mostly not running) |
| Canonical architecture + master docs | ✅ written |

## 3. GAPS — what's missing / broken / better (ranked by launch impact)
1. **The MCPs aren't running** — queens can't call their domain tools live (the L4/L5 path is wired, the servers aren't up). The moat KB is a *curated seed*; the real moat is the ~271 MCP corpus serving grounding at scale. **→ Stand up the EU-AI-Act MCP + 2-3 flagships as live grounding sources.**
2. **Generation quality** — local 3B hedges; cloud brain times out (Hermes/OpenAI key 401, OpenRouter model-name/timeout). **→ Fix the cloud key + model routing so answers are verified-correct end-to-end.**
3. **No customer-facing endpoint** — the proven loop is a Python call, not a product. **→ Expose `/verified` on the attestation API (same deploy, same Stripe gate, same audit chain).**
4. **Self-improvement is test-time only** — best-of-N proven; the *training* loop (olm_tournament) has never been fed verifier-scored episodes. **→ Feed it; close the reinforcement half.**
5. **openpatent has no UI/registry** — disclosures are real but invisible. **→ A proofof.ai/openpatent.ai page listing signed disclosures = the public proof + a sellable surface.**
6. **Hermes down** — the orchestration brain is offline (key). **→ Rotate `OPENAI_API_KEY`.**

## 4. The July-4 plan (3 waves, keyed to what sells)
**Wave 1 — Make ONE thing verified-correct + sellable (days 1-6):**
- Fix cloud key/routing → verified-correct answers end-to-end.
- Stand up EU-AI-Act MCP as the live grounding source under the meok queen.
- Expose `POST /verified` on the attestation API, gated behind Pro. **This is the launchable product.**

**Wave 2 — Proof + IP surface (days 7-12):**
- openpatent.ai page: live list of SIGIL+proofof.ai-signed disclosures (the "we patent as we build" proof).
- Feed olm_tournament verifier-scored episodes → first real "we improved" datapoint.
- Brain tournament on a 150-prompt suite → pick the production mindset (likely Compliance Critic).

**Wave 3 — Scale + launch (days 13-18):**
- Roll grounding to the governance hives (csoai, councilof, proofof).
- Launch comms: "the only AI compliance tool that verifies its own citations and patents its own work, cryptographically." Tie to the Art 50 (2 Aug 2026) cliff.

## 5. The single highest-leverage move RIGHT NOW
**Fix the cloud key + stand up the EU-AI-Act MCP as the queen's grounding source, then ship `/verified`.** That converts "proven in a script" into "a product a customer pays for" — and everything else (openpatent surface, tournament, scale) hangs off that one verified-correct, audit-logged, IP-anchored answer. One queen that *does, verifies, and patents* — then fan out.
