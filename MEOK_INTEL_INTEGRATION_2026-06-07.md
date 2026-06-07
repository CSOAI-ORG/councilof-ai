# 🐉 Dragon Intel — triaged for MEOK (2026-06-07)

Honest triage of the 48h brief. Verdict tags: **NOW** (feasible + aligned), **VALIDATES** (use as
positioning, no build), **RESEARCH** (real but big), **SIDE** (not MEOK-core), **UNVERIFIED** (don't
bake in as fact).

## The most important takeaway: the brief VALIDATES the moat we just built
- **Robinhood Agentic MCP** (scoped access · real-time activity feed · one-tap kill switch) is
  *exactly* the pattern of the funnel + governance I shipped today: per-user **tier/cap** (scoped),
  **SIGIL ledger** (real-time signed feed), **sovereign gate + worm-guard** (kill switch). The
  industry's first bank for agents uses our permission model → that's a positioning goldmine, not a build.
- **Model collapse / "Habsburg AI"** is the *proof* for CSOAI's human-in-the-loop thesis. Recursive
  AI-on-AI training degrades; human oversight = "biological diversity for AI." This is citation
  ammunition for the EU-AI-Act / NIST docs. → **NOW (content)**.

## NOW — added to the plan (loop will execute the safe ones)
- **34. agentmemory/mex patterns → SOV3 memory.** MIT MCP memory toolkits (knowledge graph, semantic
  search, cross-session). Don't fork blindly — *evaluate their patterns* and fold the best into the
  #75 pgvector+FSRS memory work. Aligns with agent-stack (#80).
- **35. GEO pass (Generative Engine Optimization).** Structured data (schema.org/JSON-LD) on the top
  domains so AI search (SGE/ChatGPT/Perplexity) cites MEOK as the authority on our sectors. Cheap, high-leverage.
- **36. Model-collapse citation → CSOAI/EU-AI-Act docs.** Add the Shumailov 2024 / MAD research as the
  evidence base for the human-in-loop governance layer. Turns compliance into a *scientific* argument.
- **37. (optional) Battle-mode tool.** One prompt → N providers → compare (Proxima-style). We already
  have the pieces (swarm_coordinator + sovereign_search chain + Kimi bridge); this is a thin wrapper,
  not new infra. Validates the multi-model thesis.

## VALIDATES (no build — use in pitch/positioning)
- **Proxima** (multi-AI MCP, battle mode, chained queries) → validates the SOV3/Kimi bridge + the
  sovereign_search provider chain. We're already on the winning pattern.
- **Higgsfield video MCP** → a *plug-in option* for DOME/marketing video later (external paid service;
  OAuth pattern noted). Not core.

## RESEARCH (real but big — log, don't rush)
- **OpenMoE base model** (openmoe.ai is owned). Decoder-only ST-MoE, token-choice routing. The prior
  honest verdict stands: a sovereign-MoE base is a major R&D lift, **not** a now-move; keep as a
  research thread, don't market it as built.
- **Post-quantum crypto.** SIGIL is **Ed25519** (not PQ-safe). China's QKD milestones make PQ a real
  future-hardening item for councilof.ai / SIGIL. Research now, migrate later (NIST PQC: ML-DSA/Dilithium).
- **Robinhood/ISO-20022 financial layer** for the haulage/trade MCPs — strategic direction, big lift.

## SIDE / not MEOK-core
- **WiFi CSI** farm presence-sensing (ESP32) — a property side-project, not the software stack.
- **OddPool / prediction markets** — interesting "truth oracle" idea; not near-term.

## UNVERIFIED — do NOT bake in as fact
- Specific model specs in the brief (MiMo 1.02T, Qwen3.5-397B, "Gemini 3.5 Flash", "Kimi K2.6",
  "DeepSeek-V4-Pro", Project Genie dates, Robinhood May-2026 launch) — I can't verify these from here.
  Treat as "landscape to watch," not numbers to quote or specs to build against. (Same discipline that
  caught our own inflated counts.)

## EAT + MOAT, honestly
The moat isn't a new model or a video gen — it's the thing competitors *don't* have and the brief
keeps circling: **scoped, signed, human-gated agent governance** (cap/tier + SIGIL + worm-guard +
care-gate). Robinhood validated the permission model; model-collapse validated the human-in-loop.
Lean the marketing into *that*, ship the funnel, and the rest is optional surface area.
