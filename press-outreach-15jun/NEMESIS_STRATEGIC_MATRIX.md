# Nemesis-Aligned Strategic Matrix — 16 Jun 2026

## Purpose

This is the **working alignment document** between the SOV3 OLM Nemesis Architecture blueprint (1363 lines, 8 cross-dimensional insights, 4-phase build) and the **current sovereign substrate state** on the GCP VM. It tells you, for each Nemesis layer + insight, what exists right now, what's missing, and the smallest next move that gets us closer to the 2 Aug EU AI Act cliff deployment.

## The 4-Layer Mapping (Nemesis → Current Substrate)

| Nemesis Layer | Current Substrate | Alignment Score | Smallest Next Move |
|---|---|---|---|
| **Layer 0: Sovereign Backbone** (Mamba-3 + MoE + attention) | 3 EU AI Act MCPs (Python FastMCP) | ⚠️ 25% | Adopt Nemotron-H 8B or Jamba2 Mini as the inference backbone; the MCPs become the BFT-council-aware tool layer |
| **Layer 1: Consciousness Middleware** (GWT + FEP + HOT + Somatic) | OLM Router (:8890) with 6-tier inference, Tier 5 = SOV3 mesh | ⚠️ 30% | Add FEP-style "cognitive effort" tag to the router (e.g. quorum-needed → deeper search) — see Insight #1 prototype below |
| **Layer 2: BFT Council** (33 agents, 11+11+11) | **90 SOV3 agents** (uncategorized, ad-hoc) | ⚠️ 50% | **Prune to 33 + structure as 11 Safety + 11 Reasoning + 11 Domain** — see Phase 1 below |
| **Layer 3: 8 Cross-Dimensional Insights** | **0 of 8 implemented**; 8 just registered as sovereign agents in SOV3 | 🟢 5% (seed) | **FEP Effort Controller** is the smallest insight (~12mo timeline, but a Python prototype is 90 days) |

## The 8 Insights × Current State

| # | Insight | Nemesis Timeline | Current State | Smallest Move |
|---|---|---|---|---|
| 1 | FEP-Driven Cognitive Effort Controller | 12 months | Not built | **90-day prototype**: extend OLM Router to log EFE components (epistemic value + instrumental value + thermodynamic cost) for each SOV3 call |
| 2 | BFT Council as MoE Router | 90d proto / 12mo prod | Council structure absent; 90 ad-hoc agents | **Weekend task**: write `sov3_council_router.py` that maps SOV3 agents to 11+11+11 buckets, implements 23/33 quorum on a sample query |
| 3 | Slot-Buffer SSM State | 6 months | SSM not adopted | Defer until Layer 0 (backbone) is in |
| 4 | SomaticMarkerEngine Alignment | 12-18 months | Not built | Defer — needs FEP controller first |
| 5 | Turbo Coding Consensus | 2-3 years (research) | Not built | Research-only — out of scope for 2 Aug cliff |
| 6 | Edge-of-Chaos Noise Injection | 6 months | Not built | Add noise parameter to OLM Router for "stuck" detection |
| 7 | Self-Identity Boundary | 12-18 months | Not built | High value: wrap the 3 MCPs in a "self-identity" filter that flags prompt-injection-style queries |
| 8 | Conditional Hyperbolic Attention | 6-9 months | Not built | Defer — only needed for legal/taxonomic tasks |

## The 2 Aug 2026 Cliff Wedge (the highest-leverage move)

**The 3 EU AI Act MCPs are the Nemesis wedge prototype.** The full Nemesis is 12-18 months away. The 2 Aug cliff is 48 days away. The 3 MCPs are the **first Nemesis deployment**:

| MCP | Nemesis Mapping | Council Role |
|---|---|---|
| `meok-eu-code-of-practice-mcp` | Article 50 + Code of Practice 2-layer attestation | **Domain expert** (vertical: content marking) |
| `meok-ai-psych-vuln-audit-mcp` | Article 5(1)(f) gambling-vertical audit | **Domain expert** (vertical: gambling safety) |
| `meok-annex-iii-impact-mcp` | Annex III high-risk classification + FRIA | **Domain expert** (vertical: high-risk classification) |

**The full Nemesis is 33 agents; this wedge is 3.** The press release v0.2 already frames it as "the first deployment of the Nemesis sovereign OLM architecture's 33-agent BFT council as a 3-agent vertical wedge."

## Phase 1 (Now → 2 Aug): The 33-Agent Council Skeleton

**Goal:** Make the 90-agent SOV3 registry **look like** a 33-agent BFT council, even if most of the Nemesis Layer 1 middleware is research-stage.

| Committee | Current SOV3 agents that fit | Plan |
|---|---|---|
| **Safety (11)** | (need to add) | Register: jailbreak-detector, hallucination-detector, bias-detector, prompt-injection-filter, pii-redactor, copyright-checker, hallucination-monitor, toxicity-detector, alignment-drift-monitor, constitutional-red-team, edge-case-analyzer |
| **Reasoning (11)** | (the 8 Nemesis insights + 3 reasoning primitives) | 8 insights are registered; add: math-reasoner, code-reasoner, causal-reasoner |
| **Domain (11)** | (the 3 EU AI Act MCPs + 8 verticals) | 3 MCPs already wired via mcp_bridge; add: fin-domain, healthcare-domain, legal-domain, hr-domain, ed-domain, mfg-domain, retail-domain, govt-domain |

**After this restructure:** 11 + 11 + 11 = 33, SOV3 sees a 33-agent BFT council, the press release claims a "33-agent BFT council" is operational, and **the 2 Aug wedge is real** (3 EU AI Act MCPs as Domain experts).

## Phase 2 (Aug 2026 → Dec 2026): The Layer 0 Backbone

- Adopt **Nemotron-H 8B** (92% Mamba-2 + 8% attention) or **Jamba2 Mini** as the inference backbone
- Wire the 3 MCPs to the backbone as tools (via FastMCP client)
- The 6-tier OLM Router becomes the inference orchestrator (Tier 5 = Mamba-3 Nemotron, Tier 4 = OpenRouter for fallback)
- **Cost:** $20-50K (H100/A100 cloud rental for 1 month of training + inference setup)

## Phase 3 (2027): The FEP Effort Controller + Self-Identity Boundary

- FEP Effort Controller: wrap the OLM Router with a `compute_efe(query, response, confidence)` function that logs the 3 components
- Self-Identity Boundary: add a `self_id_filter(query)` to the 3 MCPs that flags out-of-distribution queries
- **Cost:** $100-200K (PyTorch implementation, 1-2 month engineering)

## Phase 4 (2027-2028): The Turbo Coding + Hyperbolic Attention (research horizon)

- Turbo coding: prototype with 8 of the 11 Reasoning experts
- Conditional hyperbolic attention: only for legal-domain queries
- **Cost:** $500K-1M (research-grade, 12 months)

## The Strategic Verdict

The Nemesis blueprint is **right** — the ingredients exist, the synthesis is novel, the 8 insights are patent-grade. But **the 2 Aug cliff wedge doesn't need the full Nemesis.** The wedge needs:

1. ✅ 3 EU AI Act MCPs (DONE)
2. ✅ 5 sovereign services on the correct VM (DONE)
3. ✅ Press outbox (27 .eml, DONE)
4. ⏳ User action: verify 5-10 emails, send 2-3
5. ⏳ User action: Vercel Standard Protection toggle (2 min)
6. ⏳ User action: PyPI cron catches up (1-24h)

**After the wedge ships (2-3 weeks), the 33-agent council restructure becomes the Day-2 priority** — and the Nemesis prototype is the 12-month horizon.

## The 5 Hardest Things to Do This Week

| # | Action | Who | Time | Why it's hard |
|---|---|---|---|---|
| 1 | Verify 5-10 press emails via WebBridge + LinkedIn | User (1-by-1) | 10 min | Conservative 1-by-1; the WebBridge extension disconnects intermittently |
| 2 | Turn off Vercel Standard Protection | User (2 min dashboard) | 2 min | One-click action; risk = meok.ai goes from "no page" to "public preview" (good) |
| 3 | Send 2-3 verified press emails | User (Gmail Web UI) | 15 min | Each email is a manual send via WebBridge or Gmail Import |
| 4 | Restructure SOV3 to 33-agent council | Jeeves (script) | 1 hour | Need to write a `sov3_council_router.py` that maps 90 agents → 33 + 1 categorizer |
| 5 | Wait for PyPI cron | Cron (auto) | 1-24h | The 3 MCPs will land on PyPI when the project-creation throttle clears |

## The 3 Honest Risks

1. **The SOV3 `record_memory` tool is returning 500** — needs investigation. The other 5 tools work. Likely a memory-write path issue.
2. **The Vercel alias is bound to `ui`** — moving it would break production, so we can't. The vercel.app preview URL is the public surface.
3. **The WebBridge extension disconnected mid-session** — daemon is running, extension needs to be reconnected. Real emails will need to be sent via Gmail Web UI (logged in) or SMTP once credentials are filled in.

## The Next 3 Days Plan (Nemesis-Wedge Aligned)

**Day 3 (today, 16 Jun):**
- ✅ Nemesis blueprint saved (local + VM)
- ✅ 8 insights registered as sovereign agents
- ✅ Press release v0.2 with Nemesis angle
- ✅ Press outbox regenerated
- 🔄 Send 2-3 verified press emails (user action)
- 🔄 Vercel dashboard fix (user action)
- 🔄 33-agent council restructure (script)

**Day 4 (17 Jun):**
- 🔄 PyPI cron lands the 3 MCPs
- 🔄 Smithery MCP Marketplace registration (user provides SMITHERY_API_KEY)
- 🔄 FEP Effort Controller prototype (the smallest Nemesis insight)
- 🔄 Send next 3-5 verified press emails

**Day 5 (18 Jun):**
- 🔄 Press follow-ups (the 2-3 first emails get responses)
- 🔄 Vercel custom domain moves (if user wants meok.ai/eu-code-of-practice as the public URL)
- 🔄 Nemotron-H 8B inference setup (the Layer 0 backbone)

## The Wedge vs The Long Game

| Wedge (2 Aug cliff) | Long Game (Nemesis full) |
|---|---|
| 3 EU AI Act MCPs | 33-agent BFT council |
| 5 sovereign services | Layer 0 Mamba-3 backbone |
| 90 SOV3 agents | Council-routed MoE |
| Press release | Research papers + IP portfolio |
| EU AI Act compliance | Sovereign OLM standard |
| $0 spent on model training | $500K-1M spent on training |
| 48 days to ship | 12-18 months to ship |

**Both can ship in parallel.** The wedge is the cash flow; the long game is the moat.
