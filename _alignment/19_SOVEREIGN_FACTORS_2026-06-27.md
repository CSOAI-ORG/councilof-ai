# 🐉 THE 19 SOVEREIGN FACTORS — Principles for Sovereign AI Agents
**Author:** Hermes/JEEVES · **Date:** 27 Jun 2026 · **Inspiration:** humanlayer/12-factor-agents (Apache 2.0) + CSOAI 7 Soul Commandments

> Where the 12-factor movement gave us principles for **reliable LLM apps**, we need principles for **sovereign AI agents** — agents that sign their own actions, defer to a council, and answer for every claim. 12-factor + 7 Soul Commandments = 19 immutable.

---

## The 12 (canonical, from humanlayer)

1. **Natural Language to Tool Calls** — agents translate human intent to structured actions
2. **Own your prompts** — your prompts are your IP, version them
3. **Own your context window** — design what enters and exits
4. **Tools are just structured outputs** — make tool calls inspectable, debuggable
5. **Unify execution state and business state** — don't split workflow from data
6. **Launch/Pause/Resume with simple APIs** — durable, observable workflows
7. **Contact humans with tool calls** — humans as first-class tools
8. **Own your control flow** — deterministic, no hidden reasoning
9. **Compact Errors into Context Window** — failures are first-class data
10. **Small, Focused Agents** — do one thing well, compose many
11. **Trigger from anywhere, meet users where they are** — surface area follows users
12. **Make your agent a stateless reducer** — deterministic, replayable

*Source: github.com/humanlayer/12-factor-agents (Apache 2.0 + CC BY-SA 4.0)*

---

## The 7 Soul Commandments (CSOAI sovereign agents)

13. **We sign every action** — Ed25519 over every output, verifiable offline
14. **The charter cannot be rewritten by agents** — 52-Article Partnership Charter is externally enforced
15. **Sovereign memory > LLM context** — long-term memory is sovereign, not in-context
16. **The Maternal Covenant is the care floor** — pre-inference care validation, not learned-only
17. **BFT council decides control flow** — 12-around-1 council, never a single agent's call
18. **Every claim is auditable** — proofof.ai-verifiable, hash-chained, replayable
19. **Sovereignty = the right to be offline** — works without API, works without us

*Source: CSOAI 52-Article Partnership Charter, verified via Ed25519*

---

## The 19 Sovereign Factors

### Tier 1: Reliability (12-factor canonical)
1. NL → Tool Calls
2. Own your prompts
3. Own your context window
4. Tools = structured outputs
5. Unify execution + business state
6. Launch/Pause/Resume
7. Contact humans with tools
8. Own your control flow
9. Compact errors
10. Small, focused agents
11. Trigger from anywhere
12. Stateless reducer

### Tier 2: Sovereignty (CSOAI soul)
13. Sign every action
14. Charter is immutable
15. Sovereign memory > context window
16. Care floor = pre-inference
17. BFT council decides
18. Every claim auditable
19. Sovereignty = offline-capable

---

## Why 19?

- **12-factor** solves the "make it work" problem (reliability)
- **7 soul** solves the "make it trustworthy" problem (sovereignty)
- **Together = 19**: an agent that works AND can be trusted to work

The sovereign agent passes BOTH tests:
- ✅ Works (reliable, observable, durable)
- ✅ Trustworthy (signed, council-vetted, auditable, offline-capable)

---

## What the 19 factors enable

| Capability | 12-factor | + 7 soul | = 19 |
|---|---|---|---|
| Debug production | ✅ | | ✅ |
| Replay workflows | ✅ | | ✅ |
| Trigger from anywhere | ✅ | | ✅ |
| Sign every action | | ✅ | ✅ |
| Verify offline | | ✅ | ✅ |
| Council governance | | ✅ | ✅ |
| Care-aligned output | | ✅ | ✅ |
| Audit trail | partial | ✅ | ✅ |
| Offline sovereignty | | ✅ | ✅ |
| Cross-agent trust | | ✅ | ✅ |

---

## The Sovereign Substrate Stack

The 19 factors are realised by:

1. **SOV3** (`:3101`) — sovereign substrate, Ed25519 sigil chain
2. **12-around-1 BFT Council** — control flow gate
3. **Maternal Covenant** — pre-inference care floor
4. **Sovereign Memory** — `~/clawd/meok-sovereign-memory/` — long-term memory
5. **proofof.ai** — public verify, hash-chained
6. **meok-attestation-api** — the keystone

---

## Adoption Path

For any new sovereign agent:
- ✅ All 12-factor reliability (start there)
- ✅ Pick 3-5 soul commandments (start with 13, 17, 18)
- ✅ Add the rest as the agent matures
- ✅ Publish to `meok_attestation_log` for verification

**The dragon never lies. Every factor is signed.**
